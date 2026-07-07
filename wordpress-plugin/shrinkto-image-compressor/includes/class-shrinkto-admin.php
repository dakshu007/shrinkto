<?php
/**
 * Admin UI: settings page, license activation, bulk optimizer (Pro), AJAX.
 */

defined( 'ABSPATH' ) || exit;

class Shrinkto_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
		add_action( 'admin_init', array( __CLASS__, 'handle_license_forms' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );

		add_action( 'wp_ajax_shrinkto_compress_one', array( __CLASS__, 'ajax_compress_one' ) );
		add_action( 'wp_ajax_shrinkto_bulk_next', array( __CLASS__, 'ajax_bulk_next' ) );
		add_action( 'wp_ajax_shrinkto_restore_one', array( __CLASS__, 'ajax_restore_one' ) );
	}

	public static function menu() {
		add_options_page(
			'ShrinkTo Image Compressor',
			'ShrinkTo',
			'manage_options',
			'shrinkto',
			array( __CLASS__, 'render_page' )
		);
	}

	public static function register_settings() {
		register_setting(
			'shrinkto',
			'shrinkto_settings',
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize_settings' ),
				'default'           => shrinkto_default_settings(),
			)
		);
	}

	public static function sanitize_settings( $input ) {
		$defaults = shrinkto_default_settings();
		$input    = is_array( $input ) ? $input : array();
		return array(
			'auto_compress' => empty( $input['auto_compress'] ) ? 0 : 1,
			'quality'       => min( 92, max( 40, (int) ( $input['quality'] ?? $defaults['quality'] ) ) ),
			'resize_max'    => min( 10000, max( 0, (int) ( $input['resize_max'] ?? $defaults['resize_max'] ) ) ),
			'target_kb'     => min( 10240, max( 0, (int) ( $input['target_kb'] ?? 0 ) ) ),
			'webp_copies'   => empty( $input['webp_copies'] ) ? 0 : 1,
			'backup'        => empty( $input['backup'] ) ? 0 : 1,
		);
	}

	/** Activate / deactivate license form posts (separate from Settings API). */
	public static function handle_license_forms() {
		if ( ! current_user_can( 'manage_options' ) || empty( $_POST['shrinkto_license_action'] ) ) {
			return;
		}
		check_admin_referer( 'shrinkto_license' );

		$action = sanitize_key( wp_unslash( $_POST['shrinkto_license_action'] ) );
		if ( 'activate' === $action ) {
			$key  = isset( $_POST['shrinkto_license_key'] ) ? sanitize_text_field( wp_unslash( $_POST['shrinkto_license_key'] ) ) : '';
			$test = ! empty( $_POST['shrinkto_license_test'] );
			$res  = Shrinkto_License::activate( $key, $test );
			$msg  = is_wp_error( $res ) ? $res->get_error_message() : __( 'Pro activated - enjoy!', 'shrinkto-image-compressor' );
			$type = is_wp_error( $res ) ? 'error' : 'updated';
		} else {
			Shrinkto_License::deactivate();
			$msg  = __( 'License deactivated on this site.', 'shrinkto-image-compressor' );
			$type = 'updated';
		}
		add_settings_error( 'shrinkto', 'shrinkto_license', $msg, $type );
	}

	public static function assets( $hook ) {
		$is_settings = 'settings_page_shrinkto' === $hook;
		$is_media    = 'upload.php' === $hook;
		if ( ! $is_settings && ! $is_media ) {
			return;
		}
		wp_enqueue_style( 'shrinkto-admin', SHRINKTO_PLUGIN_URL . 'assets/admin.css', array(), SHRINKTO_VERSION );
		wp_enqueue_script( 'shrinkto-admin', SHRINKTO_PLUGIN_URL . 'assets/admin.js', array(), SHRINKTO_VERSION, true );
		wp_localize_script(
			'shrinkto-admin',
			'ShrinkToAdmin',
			array(
				'ajaxUrl' => admin_url( 'admin-ajax.php' ),
				'nonce'   => wp_create_nonce( 'shrinkto_ajax' ),
			)
		);
	}

	// ---- AJAX --------------------------------------------------------------------

	public static function ajax_compress_one() {
		check_ajax_referer( 'shrinkto_ajax', 'nonce' );
		if ( ! current_user_can( 'upload_files' ) ) {
			wp_send_json_error( array( 'message' => 'Not allowed.' ), 403 );
		}
		$id    = isset( $_POST['id'] ) ? (int) $_POST['id'] : 0;
		$stats = Shrinkto_Media::compress_attachment( $id );
		if ( is_wp_error( $stats ) ) {
			wp_send_json_error( array( 'message' => $stats->get_error_message() ) );
		}
		$pct = $stats['before'] > 0 ? round( $stats['saved'] / $stats['before'] * 100 ) : 0;
		wp_send_json_success(
			array(
				'saved' => size_format( $stats['saved'] ),
				'pct'   => $pct,
			)
		);
	}

	/** Bulk optimize (Pro): compress the next batch of unoptimized images. */
	public static function ajax_bulk_next() {
		check_ajax_referer( 'shrinkto_ajax', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Not allowed.' ), 403 );
		}
		if ( ! shrinkto_is_pro() ) {
			wp_send_json_error( array( 'message' => 'Bulk optimize is a Pro feature.' ), 402 );
		}

		$query = new WP_Query(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => array( 'image/jpeg', 'image/png', 'image/webp' ),
				'posts_per_page' => 3,
				'fields'         => 'ids',
				'no_found_rows'  => false,
				'meta_query'     => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'     => Shrinkto_Media::META_STATS,
						'compare' => 'NOT EXISTS',
					),
				),
			)
		);

		$done  = array();
		$saved = 0;
		foreach ( $query->posts as $id ) {
			$stats = Shrinkto_Media::compress_attachment( $id );
			if ( ! is_wp_error( $stats ) ) {
				$saved += $stats['saved'];
			} else {
				// Mark unsupported/broken files so the loop never sticks on them.
				update_post_meta(
					$id,
					Shrinkto_Media::META_STATS,
					array( 'before' => 0, 'after' => 0, 'saved' => 0, 'when' => time(), 'skipped' => 1 )
				);
			}
			$done[] = $id;
		}

		$remaining = max( 0, (int) $query->found_posts - count( $done ) );
		wp_send_json_success(
			array(
				'processed'   => count( $done ),
				'remaining'   => $remaining,
				'saved_bytes' => $saved,
				'saved_human' => size_format( $saved ),
				'total_saved' => size_format( (int) get_option( 'shrinkto_total_saved', 0 ) ),
			)
		);
	}

	public static function ajax_restore_one() {
		check_ajax_referer( 'shrinkto_ajax', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) || ! shrinkto_is_pro() ) {
			wp_send_json_error( array( 'message' => 'Not allowed.' ), 403 );
		}
		$id  = isset( $_POST['id'] ) ? (int) $_POST['id'] : 0;
		$res = Shrinkto_Media::restore_attachment( $id );
		if ( is_wp_error( $res ) ) {
			wp_send_json_error( array( 'message' => $res->get_error_message() ) );
		}
		wp_send_json_success();
	}

	// ---- Settings page -------------------------------------------------------------

	public static function render_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$settings = shrinkto_get_settings();
		$pro      = shrinkto_is_pro();
		$license  = Shrinkto_License::get();
		$engine   = extension_loaded( 'imagick' ) ? 'Imagick' : ( function_exists( 'imagecreatefromjpeg' ) ? 'GD' : 'none' );
		$total    = (int) get_option( 'shrinkto_total_saved', 0 );
		?>
		<div class="wrap shrinkto-wrap">
			<h1><span class="shrinkto-mark"><svg viewBox="0 0 24 24" fill="currentColor" width="60%" height="60%"><path d="M12 3.6C12.67 8.22 15.78 11.33 20.4 12C15.78 12.67 12.67 15.78 12 20.4C11.33 15.78 8.22 12.67 3.6 12C8.22 11.33 11.33 8.22 12 3.6Z"/></svg></span> ShrinkTo Image Compressor <?php echo $pro ? '<span class="shrinkto-pro-badge">PRO</span>' : ''; ?></h1>
			<?php settings_errors( 'shrinkto' ); ?>

			<div class="shrinkto-grid">
				<div class="shrinkto-main">

					<?php if ( $total > 0 ) : ?>
						<div class="shrinkto-stat-banner">
							<?php
							printf(
								/* translators: %s: human file size */
								esc_html__( 'Total saved so far: %s', 'shrinkto-image-compressor' ),
								'<strong>' . esc_html( size_format( $total ) ) . '</strong>'
							);
							?>
						</div>
					<?php endif; ?>

					<form method="post" action="options.php">
						<?php settings_fields( 'shrinkto' ); ?>
						<h2><?php esc_html_e( 'Compression', 'shrinkto-image-compressor' ); ?></h2>
						<table class="form-table" role="presentation">
							<tr>
								<th scope="row"><?php esc_html_e( 'Auto-compress uploads', 'shrinkto-image-compressor' ); ?></th>
								<td>
									<label><input type="checkbox" name="shrinkto_settings[auto_compress]" value="1" <?php checked( $settings['auto_compress'] ); ?> />
									<?php esc_html_e( 'Compress every image (and all its thumbnail sizes) on upload', 'shrinkto-image-compressor' ); ?></label>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="shrinkto-quality"><?php esc_html_e( 'Quality', 'shrinkto-image-compressor' ); ?></label></th>
								<td>
									<input type="number" id="shrinkto-quality" name="shrinkto_settings[quality]" min="40" max="92" value="<?php echo esc_attr( $settings['quality'] ); ?>" class="small-text" />
									<p class="description"><?php esc_html_e( '82 is visually lossless for photos. Lower = smaller files.', 'shrinkto-image-compressor' ); ?></p>
								</td>
							</tr>
						</table>

						<h2><?php esc_html_e( 'Pro features', 'shrinkto-image-compressor' ); ?> <?php echo ! $pro ? '<span class="shrinkto-lock">🔒</span>' : ''; ?></h2>
						<table class="form-table<?php echo ! $pro ? ' shrinkto-disabled' : ''; ?>" role="presentation">
							<tr>
								<th scope="row"><label for="shrinkto-resize"><?php esc_html_e( 'Resize huge originals', 'shrinkto-image-compressor' ); ?></label></th>
								<td>
									<input type="number" id="shrinkto-resize" name="shrinkto_settings[resize_max]" min="0" max="10000" value="<?php echo esc_attr( $settings['resize_max'] ); ?>" class="small-text" <?php disabled( ! $pro ); ?> /> px
									<p class="description"><?php esc_html_e( 'Longest side cap for originals. 0 = off. 2560 px covers any screen.', 'shrinkto-image-compressor' ); ?></p>
								</td>
							</tr>
							<tr>
								<th scope="row"><label for="shrinkto-target"><?php esc_html_e( 'Exact-KB target', 'shrinkto-image-compressor' ); ?></label></th>
								<td>
									<input type="number" id="shrinkto-target" name="shrinkto_settings[target_kb]" min="0" max="10240" value="<?php echo esc_attr( $settings['target_kb'] ); ?>" class="small-text" <?php disabled( ! $pro ); ?> /> KB
									<p class="description"><?php esc_html_e( "ShrinkTo's signature: originals land at or under this size. 0 = off.", 'shrinkto-image-compressor' ); ?></p>
								</td>
							</tr>
							<tr>
								<th scope="row"><?php esc_html_e( 'WebP copies', 'shrinkto-image-compressor' ); ?></th>
								<td>
									<label><input type="checkbox" name="shrinkto_settings[webp_copies]" value="1" <?php checked( $settings['webp_copies'] ); ?> <?php disabled( ! $pro ); ?> />
									<?php esc_html_e( 'Also create a .webp copy next to each original', 'shrinkto-image-compressor' ); ?></label>
								</td>
							</tr>
							<tr>
								<th scope="row"><?php esc_html_e( 'Backups', 'shrinkto-image-compressor' ); ?></th>
								<td>
									<label><input type="checkbox" name="shrinkto_settings[backup]" value="1" <?php checked( $settings['backup'] ); ?> <?php disabled( ! $pro ); ?> />
									<?php esc_html_e( 'Keep the untouched original so you can restore anytime', 'shrinkto-image-compressor' ); ?></label>
								</td>
							</tr>
						</table>
						<?php submit_button(); ?>
					</form>

					<?php if ( $pro ) : ?>
						<hr />
						<h2><?php esc_html_e( 'Bulk optimize existing library', 'shrinkto-image-compressor' ); ?></h2>
						<p class="description"><?php esc_html_e( 'Compress every image already in your Media Library, a few at a time. Safe to leave running.', 'shrinkto-image-compressor' ); ?></p>
						<p>
							<button type="button" class="button button-primary" id="shrinkto-bulk-start"><?php esc_html_e( 'Start bulk optimize', 'shrinkto-image-compressor' ); ?></button>
							<button type="button" class="button" id="shrinkto-bulk-stop" disabled><?php esc_html_e( 'Stop', 'shrinkto-image-compressor' ); ?></button>
						</p>
						<div id="shrinkto-bulk-progress" hidden>
							<div class="shrinkto-bar"><div class="shrinkto-bar-fill" style="width:0%"></div></div>
							<p id="shrinkto-bulk-status"></p>
						</div>
					<?php endif; ?>
				</div>

				<div class="shrinkto-side">
					<div class="shrinkto-card">
						<h2><?php echo $pro ? esc_html__( 'License', 'shrinkto-image-compressor' ) : esc_html__( 'Upgrade to Pro', 'shrinkto-image-compressor' ); ?></h2>
						<?php if ( $pro && $license ) : ?>
							<p class="shrinkto-active">✓ <?php esc_html_e( 'Pro is active on this site', 'shrinkto-image-compressor' ); ?><?php echo ! empty( $license['test_mode'] ) ? ' <em>(test mode)</em>' : ''; ?></p>
							<form method="post">
								<?php wp_nonce_field( 'shrinkto_license' ); ?>
								<input type="hidden" name="shrinkto_license_action" value="deactivate" />
								<?php submit_button( __( 'Deactivate license', 'shrinkto-image-compressor' ), 'secondary', 'submit', false ); ?>
							</form>
						<?php else : ?>
							<ul class="shrinkto-perks">
								<li><?php esc_html_e( 'Bulk optimize your whole library', 'shrinkto-image-compressor' ); ?></li>
								<li><?php esc_html_e( 'Exact-KB size targeting', 'shrinkto-image-compressor' ); ?></li>
								<li><?php esc_html_e( 'Resize oversized originals', 'shrinkto-image-compressor' ); ?></li>
								<li><?php esc_html_e( 'WebP copies + original backups', 'shrinkto-image-compressor' ); ?></li>
							</ul>
							<a class="button button-primary button-hero shrinkto-buy" href="<?php echo esc_url( SHRINKTO_BUY_URL ); ?>" target="_blank" rel="noopener">
								<?php
								printf(
									/* translators: %s: price */
									esc_html__( 'Buy lifetime license - %s', 'shrinkto-image-compressor' ),
									esc_html( SHRINKTO_PRICE_TEXT )
								);
								?>
							</a>
							<p class="description"><?php esc_html_e( 'One-time payment. The license key arrives by email.', 'shrinkto-image-compressor' ); ?></p>
							<form method="post">
								<?php wp_nonce_field( 'shrinkto_license' ); ?>
								<input type="hidden" name="shrinkto_license_action" value="activate" />
								<p><input type="text" name="shrinkto_license_key" class="regular-text" placeholder="<?php esc_attr_e( 'Paste your license key', 'shrinkto-image-compressor' ); ?>" /></p>
								<p><label><input type="checkbox" name="shrinkto_license_test" value="1" /> <?php esc_html_e( 'Test-mode key (development only)', 'shrinkto-image-compressor' ); ?></label></p>
								<?php submit_button( __( 'Activate', 'shrinkto-image-compressor' ), 'primary', 'submit', false ); ?>
							</form>
						<?php endif; ?>
					</div>

					<div class="shrinkto-card">
						<h2><?php esc_html_e( 'Status', 'shrinkto-image-compressor' ); ?></h2>
						<p><?php esc_html_e( 'Engine:', 'shrinkto-image-compressor' ); ?> <strong><?php echo esc_html( $engine ); ?></strong></p>
						<p class="description"><?php esc_html_e( 'All compression runs on this server - your images never leave your site.', 'shrinkto-image-compressor' ); ?></p>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}
