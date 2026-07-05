<?php
/**
 * Media library integration: compress on upload, per-image actions,
 * savings column, backups (Pro) and restore.
 */

defined( 'ABSPATH' ) || exit;

class Shrinkto_Media {

	const META_STATS = '_shrinkto_stats';

	public static function init() {
		// Compress the original + every generated size right after upload.
		add_filter( 'wp_generate_attachment_metadata', array( __CLASS__, 'on_upload' ), 20, 2 );

		// Media list table column.
		add_filter( 'manage_media_columns', array( __CLASS__, 'column' ) );
		add_action( 'manage_media_custom_column', array( __CLASS__, 'column_content' ), 10, 2 );
	}

	/** Auto-compress a fresh upload (original + all sizes). */
	public static function on_upload( $metadata, $attachment_id ) {
		$settings = shrinkto_get_settings();
		if ( empty( $settings['auto_compress'] ) ) {
			return $metadata;
		}
		self::compress_attachment( $attachment_id, $metadata );
		return $metadata;
	}

	/**
	 * Compress one attachment (original file + generated sizes).
	 * Returns stats array or WP_Error.
	 */
	public static function compress_attachment( $attachment_id, $metadata = null ) {
		$file = get_attached_file( $attachment_id );
		if ( ! $file || ! Shrinkto_Compressor::supported_mime( (string) get_post_mime_type( $attachment_id ) ) ) {
			return new WP_Error( 'shrinkto_skip', 'Not a compressible image.' );
		}

		$settings = shrinkto_get_settings();
		$pro      = shrinkto_is_pro();

		// Pro: keep a one-time backup of the pristine original.
		if ( $pro && ! empty( $settings['backup'] ) ) {
			self::backup_original( $attachment_id, $file );
		}

		$args = array( 'quality' => (int) $settings['quality'] );
		if ( $pro ) {
			$args['resize_max'] = (int) $settings['resize_max'];
			$args['target_kb']  = (int) $settings['target_kb'];
		}

		$total_before = 0;
		$total_after  = 0;

		// Original.
		$result = Shrinkto_Compressor::compress_file( $file, $args );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$total_before += $result['before'];
		$total_after  += $result['after'];

		// Generated sizes: quality only - no resize/target on thumbnails.
		if ( null === $metadata ) {
			$metadata = wp_get_attachment_metadata( $attachment_id );
		}
		$dir = trailingslashit( dirname( $file ) );
		if ( ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
			foreach ( $metadata['sizes'] as $size ) {
				if ( empty( $size['file'] ) ) {
					continue;
				}
				$size_result = Shrinkto_Compressor::compress_file(
					$dir . $size['file'],
					array( 'quality' => (int) $settings['quality'] )
				);
				if ( ! is_wp_error( $size_result ) ) {
					$total_before += $size_result['before'];
					$total_after  += $size_result['after'];
				}
			}
		}

		// Pro: sibling WebP copy of the original.
		if ( $pro && ! empty( $settings['webp_copies'] ) ) {
			Shrinkto_Compressor::make_webp_copy( $file, (int) $settings['quality'] );
		}

		// The original may have been resized - refresh its metadata dimensions.
		if ( $pro && ! empty( $settings['resize_max'] ) ) {
			$dims = wp_getimagesize( $file );
			if ( $dims && ! empty( $metadata['width'] ) ) {
				$metadata['width']  = $dims[0];
				$metadata['height'] = $dims[1];
				wp_update_attachment_metadata( $attachment_id, $metadata );
			}
		}

		$stats = array(
			'before'  => $total_before,
			'after'   => $total_after,
			'saved'   => max( 0, $total_before - $total_after ),
			'when'    => time(),
			'version' => SHRINKTO_VERSION,
		);
		update_post_meta( $attachment_id, self::META_STATS, $stats );

		// Site-wide savings counter.
		$grand = (int) get_option( 'shrinkto_total_saved', 0 );
		update_option( 'shrinkto_total_saved', $grand + $stats['saved'], false );

		return $stats;
	}

	/** Copy the untouched original into uploads/shrinkto-backups/ (once). */
	private static function backup_original( $attachment_id, $file ) {
		if ( get_post_meta( $attachment_id, '_shrinkto_backup', true ) ) {
			return;
		}
		$uploads = wp_get_upload_dir();
		$dest_dir = trailingslashit( $uploads['basedir'] ) . 'shrinkto-backups';
		if ( ! wp_mkdir_p( $dest_dir ) ) {
			return;
		}
		$dest = trailingslashit( $dest_dir ) . $attachment_id . '-' . wp_basename( $file );
		if ( copy( $file, $dest ) ) {
			update_post_meta( $attachment_id, '_shrinkto_backup', $dest );
		}
	}

	/** Restore the pristine original (Pro) and regenerate sizes. */
	public static function restore_attachment( $attachment_id ) {
		$backup = get_post_meta( $attachment_id, '_shrinkto_backup', true );
		$file   = get_attached_file( $attachment_id );
		if ( ! $backup || ! file_exists( $backup ) || ! $file ) {
			return new WP_Error( 'shrinkto_restore', 'No backup available for this image.' );
		}
		if ( ! copy( $backup, $file ) ) {
			return new WP_Error( 'shrinkto_restore', 'Could not restore the backup.' );
		}
		// Regenerate thumbnails from the restored original.
		require_once ABSPATH . 'wp-admin/includes/image.php';
		$metadata = wp_generate_attachment_metadata( $attachment_id, $file );
		wp_update_attachment_metadata( $attachment_id, $metadata );
		delete_post_meta( $attachment_id, self::META_STATS );
		return true;
	}

	// ---- Media list column ------------------------------------------------------

	public static function column( $columns ) {
		$columns['shrinkto'] = __( 'ShrinkTo', 'shrinkto-image-compressor' );
		return $columns;
	}

	public static function column_content( $column, $attachment_id ) {
		if ( 'shrinkto' !== $column ) {
			return;
		}
		if ( ! Shrinkto_Compressor::supported_mime( (string) get_post_mime_type( $attachment_id ) ) ) {
			echo '<span aria-hidden="true">—</span>';
			return;
		}
		$stats = get_post_meta( $attachment_id, self::META_STATS, true );
		if ( is_array( $stats ) && isset( $stats['saved'] ) ) {
			$pct = $stats['before'] > 0 ? round( $stats['saved'] / $stats['before'] * 100 ) : 0;
			printf(
				'<span class="shrinkto-done">✓ %s (−%d%%)</span>',
				esc_html( size_format( $stats['saved'] ) ),
				(int) $pct
			);
			return;
		}
		printf(
			'<button type="button" class="button button-small shrinkto-compress-one" data-id="%d">%s</button>',
			(int) $attachment_id,
			esc_html__( 'Compress', 'shrinkto-image-compressor' )
		);
	}
}
