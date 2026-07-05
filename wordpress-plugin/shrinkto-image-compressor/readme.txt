=== ShrinkTo Image Compressor ===
Contributors: shrinkto
Tags: image compression, optimize images, webp, compress, media library
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Compress every image on upload - on your own server. No third-party uploads, no monthly fees, no credit-based pricing.

== Description ==

ShrinkTo compresses your images the moment they're uploaded - the original **and** every thumbnail size WordPress generates. Unlike most optimizer plugins, nothing is ever sent to an external service: compression runs on your own server with Imagick or GD, so your photos stay private and there are no monthly quotas.

**Free features**

* Auto-compress JPEG, PNG and WebP on upload (original + all sizes)
* Progressive JPEG output and EXIF/GPS metadata stripping (smaller *and* more private)
* One-click compress button and savings column in the Media Library
* Total-savings counter

**Pro (one-time payment, lifetime license)**

* Bulk optimize your entire existing Media Library with a progress bar
* Exact-KB targeting - originals land at or under the size you choose (ShrinkTo's signature)
* Resize oversized originals to a sensible maximum dimension
* Automatic .webp copies alongside originals
* Untouched-original backups with one-click restore

Pro is a single small payment at [shrinkto.com](https://shrinkto.com) - no subscription, no per-image credits.

== Frequently Asked Questions ==

= Are my images uploaded anywhere? =
No. All compression happens on your own server using Imagick or GD. Your files never leave your site.

= Will it compress images I uploaded before installing? =
Yes - that's the Pro "Bulk optimize" feature, which works through your whole library a few images at a time.

= Does it slow down uploads? =
Compression adds a moment per image at upload time, then saves bandwidth on every single page view afterwards.

= What happens if I deactivate the plugin? =
Nothing breaks - your images simply stay as they are. Pro backups remain in uploads/shrinkto-backups until you restore or delete them.

== Changelog ==

= 1.0.0 =
* Initial release: on-upload compression, media column, Pro bulk optimize, exact-KB targeting, WebP copies, backups & restore, Dodo Payments licensing.
