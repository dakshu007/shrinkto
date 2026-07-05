<?php
/**
 * Plugin Name:       ShrinkTo Image Compressor
 * Plugin URI:        https://shrinkto.com
 * Description:       Compress every image on upload - right on your own server. No third-party uploads, no monthly fees. Pro adds bulk optimize, exact-KB targeting, WebP copies and backups.
 * Version:           1.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            ShrinkTo
 * Author URI:        https://shrinkto.com
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       shrinkto-image-compressor
 */

defined( 'ABSPATH' ) || exit;

define( 'SHRINKTO_VERSION', '1.0.0' );
define( 'SHRINKTO_PLUGIN_FILE', __FILE__ );
define( 'SHRINKTO_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SHRINKTO_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Where "Upgrade to Pro" points. Create a Dodo Payments product with License
 * Keys enabled and paste its FULL checkout link here (short links drop params).
 */
if ( ! defined( 'SHRINKTO_BUY_URL' ) ) {
	define( 'SHRINKTO_BUY_URL', 'https://test.checkout.dodopayments.com/buy/pdt_0NiTZmrZoFZS9LGhjmHQe?quantity=1' );
}
define( 'SHRINKTO_PRICE_TEXT', '$2' );

require_once SHRINKTO_PLUGIN_DIR . 'includes/class-shrinkto-compressor.php';
require_once SHRINKTO_PLUGIN_DIR . 'includes/class-shrinkto-license.php';
require_once SHRINKTO_PLUGIN_DIR . 'includes/class-shrinkto-media.php';
require_once SHRINKTO_PLUGIN_DIR . 'includes/class-shrinkto-admin.php';

/** Default settings. */
function shrinkto_default_settings() {
	return array(
		'auto_compress' => 1,
		'quality'       => 82,
		// Pro options (ignored until a license is active).
		'resize_max'    => 2560, // px, 0 = off
		'target_kb'     => 0,    // 0 = off; applies to the original image
		'webp_copies'   => 0,
		'backup'        => 1,
	);
}

/** Current settings merged over defaults. */
function shrinkto_get_settings() {
	$saved = get_option( 'shrinkto_settings', array() );
	return wp_parse_args( is_array( $saved ) ? $saved : array(), shrinkto_default_settings() );
}

/** Is a Pro license active? */
function shrinkto_is_pro() {
	return Shrinkto_License::is_active();
}

register_activation_hook( __FILE__, function () {
	if ( ! get_option( 'shrinkto_settings' ) ) {
		add_option( 'shrinkto_settings', shrinkto_default_settings() );
	}
} );

add_action( 'plugins_loaded', function () {
	Shrinkto_Media::init();
	Shrinkto_Admin::init();
} );

/** Settings shortcut on the Plugins screen. */
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), function ( $links ) {
	$url = admin_url( 'options-general.php?page=shrinkto' );
	array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'shrinkto-image-compressor' ) . '</a>' );
	if ( ! shrinkto_is_pro() ) {
		$links[] = '<a href="' . esc_url( SHRINKTO_BUY_URL ) . '" target="_blank" style="color:#d63638;font-weight:600;">' . esc_html__( 'Upgrade to Pro', 'shrinkto-image-compressor' ) . '</a>';
	}
	return $links;
} );
