<?php
/**
 * Core image compression - Imagick preferred, GD fallback. Runs entirely on
 * this server: no file ever leaves the site.
 */

defined( 'ABSPATH' ) || exit;

class Shrinkto_Compressor {

	const MIN_QUALITY = 30;
	const MAX_QUALITY = 92;

	/** MIME types we can compress. */
	public static function supported_mime( $mime ) {
		return in_array( $mime, array( 'image/jpeg', 'image/png', 'image/webp' ), true );
	}

	/**
	 * Compress a file in place.
	 *
	 * @param string $path Absolute file path.
	 * @param array  $args { quality, resize_max, target_kb }.
	 * @return array|WP_Error { before, after, saved } bytes.
	 */
	public static function compress_file( $path, $args = array() ) {
		if ( ! file_exists( $path ) || ! is_writable( dirname( $path ) ) ) {
			return new WP_Error( 'shrinkto_missing', 'File not found or not writable.' );
		}
		$mime = wp_get_image_mime( $path );
		if ( ! self::supported_mime( $mime ) ) {
			return new WP_Error( 'shrinkto_type', 'Unsupported image type.' );
		}

		$quality    = min( self::MAX_QUALITY, max( self::MIN_QUALITY, (int) ( $args['quality'] ?? 82 ) ) );
		$resize_max = max( 0, (int) ( $args['resize_max'] ?? 0 ) );
		$target_kb  = max( 0, (int) ( $args['target_kb'] ?? 0 ) );

		$before = (int) filesize( $path );

		$bytes = self::encode( $path, $mime, $quality, $resize_max, $target_kb );
		if ( is_wp_error( $bytes ) ) {
			return $bytes;
		}

		// Never make a file bigger.
		if ( strlen( $bytes ) >= $before ) {
			return array( 'before' => $before, 'after' => $before, 'saved' => 0 );
		}

		if ( false === file_put_contents( $path, $bytes ) ) { // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
			return new WP_Error( 'shrinkto_write', 'Could not write compressed file.' );
		}
		clearstatcache( true, $path );
		$after = (int) filesize( $path );

		return array( 'before' => $before, 'after' => $after, 'saved' => $before - $after );
	}

	/** Produce compressed bytes for the image, honoring resize + exact-KB. */
	private static function encode( $path, $mime, $quality, $resize_max, $target_kb ) {
		if ( extension_loaded( 'imagick' ) && class_exists( 'Imagick' ) ) {
			return self::encode_imagick( $path, $mime, $quality, $resize_max, $target_kb );
		}
		if ( function_exists( 'imagecreatefromjpeg' ) ) {
			return self::encode_gd( $path, $mime, $quality, $resize_max, $target_kb );
		}
		return new WP_Error( 'shrinkto_noengine', 'Neither Imagick nor GD is available on this server.' );
	}

	// ---- Imagick ---------------------------------------------------------------

	private static function encode_imagick( $path, $mime, $quality, $resize_max, $target_kb ) {
		try {
			$img = new Imagick( $path );
			$img->setImageOrientation( Imagick::ORIENTATION_TOPLEFT );

			if ( $resize_max > 0 ) {
				$w = $img->getImageWidth();
				$h = $img->getImageHeight();
				if ( max( $w, $h ) > $resize_max ) {
					$img->resizeImage(
						$w >= $h ? $resize_max : 0,
						$h > $w ? $resize_max : 0,
						Imagick::FILTER_LANCZOS,
						1
					);
				}
			}

			$img->stripImage(); // EXIF/GPS/thumbnails gone - smaller and private.

			if ( 'image/png' === $mime ) {
				$img->setOption( 'png:compression-level', '9' );
				$bytes = $img->getImageBlob();
				$img->destroy();
				return $bytes;
			}

			if ( $target_kb > 0 ) {
				$target = $target_kb * 1024;
				$w      = $img->getImageWidth();
				$h      = $img->getImageHeight();
				$smallest = null;
				// Quality-first, then downscale - same ladder as shrinkto.com.
				foreach ( self::target_scales() as $scale ) {
					$work = clone $img;
					if ( $scale < 0.999 ) {
						$work->resizeImage( max( 1, (int) round( $w * $scale ) ), max( 1, (int) round( $h * $scale ) ), Imagick::FILTER_LANCZOS, 1 );
					}
					$emit = function ( $q ) use ( $work, $mime ) {
						$clone = clone $work;
						$clone->setImageFormat( 'image/webp' === $mime ? 'webp' : 'jpeg' );
						$clone->setImageCompressionQuality( $q );
						$out = $clone->getImageBlob();
						$clone->destroy();
						return $out;
					};
					$bytes = self::search_quality( $emit, $target );
					$work->destroy();
					if ( null === $smallest || strlen( $bytes ) < strlen( $smallest ) ) {
						$smallest = $bytes;
					}
					if ( strlen( $bytes ) <= $target ) {
						$img->destroy();
						return $bytes;
					}
				}
				$img->destroy();
				return $smallest;
			}

			$img->setImageCompressionQuality( $quality );
			if ( 'image/jpeg' === $mime ) {
				$img->setInterlaceScheme( Imagick::INTERLACE_PLANE ); // progressive
			}
			$bytes = $img->getImageBlob();
			$img->destroy();
			return $bytes;
		} catch ( Exception $e ) {
			return new WP_Error( 'shrinkto_imagick', $e->getMessage() );
		}
	}

	// ---- GD --------------------------------------------------------------------

	private static function encode_gd( $path, $mime, $quality, $resize_max, $target_kb ) {
		switch ( $mime ) {
			case 'image/jpeg':
				$img = imagecreatefromjpeg( $path );
				break;
			case 'image/png':
				$img = imagecreatefrompng( $path );
				break;
			case 'image/webp':
				$img = function_exists( 'imagecreatefromwebp' ) ? imagecreatefromwebp( $path ) : false;
				break;
			default:
				$img = false;
		}
		if ( ! $img ) {
			return new WP_Error( 'shrinkto_gd', 'GD could not read this image.' );
		}

		if ( $resize_max > 0 ) {
			$w = imagesx( $img );
			$h = imagesy( $img );
			if ( max( $w, $h ) > $resize_max ) {
				$ratio = $resize_max / max( $w, $h );
				$img   = imagescale( $img, (int) round( $w * $ratio ), (int) round( $h * $ratio ), IMG_BICUBIC );
			}
		}

		$emit_for = function ( $work ) use ( $mime ) {
			return function ( $q ) use ( $work, $mime ) {
				ob_start();
				if ( 'image/png' === $mime ) {
					imagepng( $work, null, 9 );
				} elseif ( 'image/webp' === $mime && function_exists( 'imagewebp' ) ) {
					imagewebp( $work, null, $q );
				} else {
					imageinterlace( $work, true ); // progressive JPEG
					imagejpeg( $work, null, $q );
				}
				return ob_get_clean();
			};
		};

		if ( 'image/png' !== $mime && $target_kb > 0 ) {
			// Quality-first, then downscale - same ladder as shrinkto.com.
			$target   = $target_kb * 1024;
			$w        = imagesx( $img );
			$h        = imagesy( $img );
			$smallest = null;
			foreach ( self::target_scales() as $scale ) {
				$work = $scale >= 0.999
					? $img
					: imagescale( $img, max( 1, (int) round( $w * $scale ) ), max( 1, (int) round( $h * $scale ) ), IMG_BICUBIC );
				$bytes = self::search_quality( $emit_for( $work ), $target );
				if ( $work !== $img ) {
					imagedestroy( $work );
				}
				if ( null === $smallest || strlen( $bytes ) < strlen( $smallest ) ) {
					$smallest = $bytes;
				}
				if ( strlen( $bytes ) <= $target ) {
					imagedestroy( $img );
					return $bytes;
				}
			}
			imagedestroy( $img );
			return $smallest;
		}

		$emit  = $emit_for( $img );
		$bytes = $emit( $quality );
		imagedestroy( $img );
		return $bytes;
	}

	/** Downscale steps tried when quality alone can't reach an exact-KB target. */
	private static function target_scales() {
		return array( 1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.28, 0.22 );
	}

	/**
	 * Binary-search the highest quality whose output fits the byte target.
	 * Falls back to the smallest attempt if the target is unreachable.
	 */
	private static function search_quality( $emit, $target_bytes ) {
		$lo       = self::MIN_QUALITY;
		$hi       = self::MAX_QUALITY;
		$best     = null;
		$smallest = null;

		$floor = $emit( $lo );
		if ( null === $smallest || strlen( $floor ) < strlen( $smallest ) ) {
			$smallest = $floor;
		}
		if ( strlen( $floor ) <= $target_bytes ) {
			$best = $floor;
			while ( $hi > $lo ) {
				$mid = (int) ceil( ( $lo + $hi ) / 2 );
				$try = $emit( $mid );
				if ( strlen( $try ) <= $target_bytes ) {
					$best = $try;
					$lo   = $mid;
					if ( strlen( $try ) >= $target_bytes * 0.93 ) {
						break;
					}
				} else {
					$hi = $mid - 1;
				}
			}
		}

		return null !== $best ? $best : $smallest;
	}

	/** Create a .webp sibling of the file (Pro). Returns bytes saved vs original or 0. */
	public static function make_webp_copy( $path, $quality ) {
		$mime = wp_get_image_mime( $path );
		if ( 'image/jpeg' !== $mime && 'image/png' !== $mime ) {
			return 0;
		}
		$dest = $path . '.webp';
		try {
			if ( extension_loaded( 'imagick' ) && class_exists( 'Imagick' ) ) {
				$img = new Imagick( $path );
				$img->setImageFormat( 'webp' );
				$img->setImageCompressionQuality( $quality );
				$img->stripImage();
				$img->writeImage( $dest );
				$img->destroy();
			} elseif ( function_exists( 'imagewebp' ) ) {
				$img = 'image/png' === $mime ? imagecreatefrompng( $path ) : imagecreatefromjpeg( $path );
				if ( ! $img ) {
					return 0;
				}
				imagepalettetotruecolor( $img );
				imagewebp( $img, $dest, $quality );
				imagedestroy( $img );
			} else {
				return 0;
			}
		} catch ( Exception $e ) {
			return 0;
		}
		return file_exists( $dest ) ? (int) filesize( $dest ) : 0;
	}
}
