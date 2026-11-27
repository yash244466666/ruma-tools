# 0032 — Tool Atlas utilities in the GitHub testing build

Accepted for the GitHub debug APK and Pages tester preview, 2026-11-27. Revisit before promoting any preview entry to the Play scope.

The owner selected Tool Atlas and requested working device, sensor, file, camera and daily utilities for a downloadable GitHub build. The catalog adds preview entries to the existing seven categories. The release AAB uses the normal Vite production mode and the original manifest. Android debug and internal variants overlay the tool-preview assets and register the tester-only native plugins. The hosted Pages build uses the preview catalog and labels Android-only capabilities.

The tester APK may request foreground precise location after Start GPS and camera access after Open camera. GPS uses the Android satellite provider and stops on Activity pause. Camera and tuner sessions close on navigation and deactivation. The user can explicitly save one parking spot and a packing checklist in ordinary local preferences. Settings lists and clears these records. Media capture, sensor samples and regular GPS fixes remain in memory.

Document operations use a system-chosen folder, opaque session handles and content URIs. The cleaner requests confirmation with specific filenames and sizes. The battery and camera information screens read reported properties without hardware identifiers. IP classification runs locally and opening a public address on RIPEstat launches the external browser. The bundled WebView provider allowlist retains Frankfurter.

JSZip creates archives. The tester-only libarchive WebAssembly reader runs in a terminable worker, accepts ZIP and RAR signatures, caps input, entry count, runtime and each export, and uses the system Save As destination. New archives use ZIP. jsQR reads a user-selected image locally. The four-corner scanner, print sheets, redaction and comparison use user-specified geometry. Automatic camera measurement and OCR remain deferred.

The physical-device certification, privacy and Play review gates apply before any change to the production release scope.
