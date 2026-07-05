<?php
/**
 * Dodo Payments license handling - same public endpoints as the ShrinkTo
 * Chrome extension: /licenses/activate, /licenses/validate, /licenses/deactivate.
 * Network failures never lock a paying user out (grace on errors).
 */

defined( 'ABSPATH' ) || exit;

class Shrinkto_License {

	const OPTION = 'shrinkto_license';

	private static function base_url( $test_mode ) {
		return $test_mode ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com';
	}

	public static function get() {
		$lic = get_option( self::OPTION );
		return is_array( $lic ) ? $lic : null;
	}

	/** Cheap gate check; lazily revalidates once a week. */
	public static function is_active() {
		$lic = self::get();
		if ( ! $lic || empty( $lic['valid'] ) ) {
			return false;
		}
		$last = (int) ( $lic['last_validated'] ?? 0 );
		if ( time() - $last > WEEK_IN_SECONDS && ! get_transient( 'shrinkto_validating' ) ) {
			set_transient( 'shrinkto_validating', 1, HOUR_IN_SECONDS );
			self::revalidate();
		}
		return true;
	}

	/** Activate a key. Returns true or WP_Error. */
	public static function activate( $key, $test_mode = false ) {
		$key = trim( (string) $key );
		if ( '' === $key ) {
			return new WP_Error( 'shrinkto_license', __( 'Please enter your license key.', 'shrinkto-image-compressor' ) );
		}

		$res = wp_remote_post(
			self::base_url( $test_mode ) . '/licenses/activate',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'license_key' => $key,
						'name'        => 'WordPress - ' . wp_parse_url( home_url(), PHP_URL_HOST ),
					)
				),
			)
		);

		if ( is_wp_error( $res ) ) {
			return new WP_Error( 'shrinkto_license', __( "Couldn't reach the license server. Try again.", 'shrinkto-image-compressor' ) );
		}

		$code = (int) wp_remote_retrieve_response_code( $res );
		$body = json_decode( wp_remote_retrieve_body( $res ), true );

		if ( $code < 200 || $code >= 300 ) {
			$msg = is_array( $body ) && ! empty( $body['message'] )
				? $body['message']
				: __( "That license key wasn't accepted. Copy it exactly as it appears in your purchase email.", 'shrinkto-image-compressor' );
			return new WP_Error( 'shrinkto_license', $msg );
		}

		$instance_id = '';
		if ( is_array( $body ) ) {
			$instance_id = $body['id'] ?? ( $body['instance']['id'] ?? '' );
		}

		update_option(
			self::OPTION,
			array(
				'key'            => $key,
				'instance_id'    => $instance_id,
				'test_mode'      => (bool) $test_mode,
				'valid'          => true,
				'activated_at'   => time(),
				'last_validated' => time(),
			),
			false
		);
		return true;
	}

	/** Confirm the key is still valid; only an explicit "valid: false" locks. */
	public static function revalidate() {
		$lic = self::get();
		if ( ! $lic ) {
			return false;
		}
		if ( empty( $lic['instance_id'] ) ) {
			$lic['last_validated'] = time();
			update_option( self::OPTION, $lic, false );
			return true;
		}

		$res = wp_remote_post(
			self::base_url( ! empty( $lic['test_mode'] ) ) . '/licenses/validate',
			array(
				'timeout' => 15,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => wp_json_encode(
					array(
						'license_key'             => $lic['key'],
						'license_key_instance_id' => $lic['instance_id'],
					)
				),
			)
		);

		$lic['last_validated'] = time();
		if ( ! is_wp_error( $res ) && 200 === (int) wp_remote_retrieve_response_code( $res ) ) {
			$body = json_decode( wp_remote_retrieve_body( $res ), true );
			if ( is_array( $body ) && isset( $body['valid'] ) && false === $body['valid'] ) {
				$lic['valid'] = false;
			}
		}
		update_option( self::OPTION, $lic, false );
		return ! empty( $lic['valid'] );
	}

	/** Free this site's seat and forget the key. */
	public static function deactivate() {
		$lic = self::get();
		if ( $lic && ! empty( $lic['instance_id'] ) ) {
			wp_remote_post(
				self::base_url( ! empty( $lic['test_mode'] ) ) . '/licenses/deactivate',
				array(
					'timeout' => 15,
					'headers' => array( 'Content-Type' => 'application/json' ),
					'body'    => wp_json_encode(
						array(
							'license_key'             => $lic['key'],
							'license_key_instance_id' => $lic['instance_id'],
						)
					),
				)
			);
		}
		delete_option( self::OPTION );
	}
}
