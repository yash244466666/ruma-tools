# Tool ideas and user-reported usability work

Discussed on 2026-11-27. [বাংলা তালিকা](TOOL_ROADMAP_BN.md). Tool Atlas is the approved layout. The initial inventory comprised 9 existing tools to improve and 15 candidate utilities. Subsequent owner selections and deferred ideas are recorded below. Tool Atlas is the separate layout project for the 38 enabled tools. Additional recording features beyond noise reduction are open for discussion.

## Existing tools to improve

| Tool                | What the owner observed                                                                                                                     | Proposed acceptance check                                                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compass             | The dial makes the four directions difficult to read. Calibration needs an explicit flow.                                                   | Keep north, east, south and west legible, show where the top of the phone points and identify magnetic north. Provide a guided figure-eight calibration flow that reports actual magnetometer accuracy and interference. Withhold the heading until there is a reading. Check four known headings, portrait and landscape, on a phone. |
| Level & Angle       | The current interface is difficult to use and its angle readings appear unreliable. The existing single-sample zero action is insufficient. | Show which edge to raise and by how many degrees. Guide the user through setting and clearing a reference on a steady surface. Distinguish motion, missing data and a valid zero. Compare repeated readings on a flat reference and at known angles, then rotate the phone and check the same surfaces again.                          |
| Image Compressor    | Choosing an image and tapping Compress produces no visible result on the owner's phone.                                                     | Show progress at the action, the output size and preview or a specific recoverable error. Verify JPEG, PNG and WebP pick, resize and export. Repeat the owner's case on a physical phone.                                                                                                                                              |
| Recipe Scaler       | People cannot tell which serving count to enter or how to use the ingredient list.                                                          | Show the recipe's current servings, the number to cook for and a worked example with the resulting quantities.                                                                                                                                                                                                                         |
| iCalendar Generator | The event can be generated but there is no .ics download.                                                                                   | Save the generated UTF-8 calendar through Android's file picker and compare the file with the preview.                                                                                                                                                                                                                                 |
| vCard Generator     | The generated contact has no .vcf download.                                                                                                 | Save the generated UTF-8 contact through Android's file picker with its .vcf extension and verify its contents.                                                                                                                                                                                                                        |
| Audio Recorder      | Saving WebM reports that the output MIME type is invalid. The owner also requested noise reduction.                                         | Export recorded WebM bytes as audio/webm while retaining codec metadata for playback. For noise reduction, plan an optional capture setting, disclose device support and compare matched recordings on a physical phone.                                                                                                               |
| Dice Roller         | The notation-first screen and short number animation feel unlike rolling a die in Ludo.                                                     | Open with a large pip die. Tap or shake once to tumble and settle on the actual drawn face. Keep keyboard controls, a text result, reduced motion and optional advanced notation. Test shakes on a physical phone.                                                                                                                     |
| Random Picker       | List and number results feel like plain text. The owner chose an upward draw of name cards for lists.                                       | Pick once, slow the cards to the selected name, show the full winning name and bypass animation with reduced motion. Preserve duplicate-entry weighting.                                                                                                                                                                               |

## Candidate tools

|   # | Idea                        | Smallest useful interaction                                                                                                                                                                                                                              |
| --: | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|   1 | GPS speedometer             | Open the foreground tool and see current speed in km/h or mph, fix age and available speed accuracy. Show a waiting state when there is no speed estimate.                                                                                               |
|   2 | Offline GPS coordinates     | Obtain latitude, longitude and estimated accuracy from a satellite fix. Show fix age and explicitly copy coordinates. Maps and address lookup are separate features.                                                                                     |
|   3 | Screen ruler                | Match a reference of known length, then measure a small object against an on-screen scale.                                                                                                                                                               |
|   4 | Compare two measurements    | Capture two sensor readings in sequence and show their difference, starting with illuminance. Evaluate adding this to Light Meter during design.                                                                                                         |
|   5 | Read QR from image          | Select an image or screenshot using the system picker and decode its contents locally. Let the user decide whether to open a link.                                                                                                                       |
|   6 | Redact a photo              | Select an image, cover private details with solid blocks and export a flattened copy. Verify covered pixels and private metadata are absent from the export.                                                                                             |
|   7 | Group expense settlement    | Enter who paid each shared bill and see the transfers needed to settle up.                                                                                                                                                                               |
|   8 | Savings goal                | Enter a target, current savings and deadline to calculate a weekly or monthly contribution.                                                                                                                                                              |
|   9 | Reusable packing checklist  | Create a trip checklist, mark items packed and reuse a clean copy for the next trip.                                                                                                                                                                     |
|  10 | Camera Measure              | On a supported phone, mark three corners of a rectangular surface to estimate its length and width. For a photo-based option, include a reference of known dimensions in the same plane and account for perspective. Validate against tape measurements. |
|  11 | Find parked vehicle         | Save a parking position explicitly and later show approximate distance and direction outdoors. Provide deletion and an accuracy indicator.                                                                                                               |
|  12 | Magnifier and freeze frame  | Enlarge small print with the camera and freeze the image to read it comfortably.                                                                                                                                                                         |
|  13 | Walking session and cadence | Start a session, count steps and display elapsed time and average steps per minute. Check step-sensor availability and activity-recognition access.                                                                                                      |
|  14 | Tile and paint estimator    | Deduct openings from measured wall or floor area. Calculate materials from tile size, coverage and an explicit waste allowance.                                                                                                                          |
|  15 | Picture-frame spacing       | Enter wall and frame widths, then display each frame's edge or center position from a common starting point.                                                                                                                                             |

## Accepted additions to the plan

- **Movement alarm.** Arm while the app is open, allow a short settling delay, and signal when the phone is moved. Use the existing accelerometer and provide a stop action.
- **Named cooking timers.** Extend Countdown Timer with simultaneous named timers and distinct completion announcements. Reuse its existing notification and lifecycle rules.
- **Appliance electricity cost.** Calculate kWh and estimated cost from watts, daily run time, days and the user's own tariff. Show the total across appliances.

- **Shopping basket.** Start work on a running total with a budget, an item price and quantity, plus an increment button per item. The initial implementation fits alongside the shopping comparison tool.

Three further proposals discussed were a loaned-items register, a repeating shift calendar, and a relative before/after sound-level comparison on the same phone. The owner declined the subsequent tap counter, parking-fee calculator and clothing-measurement book.

## Seven phone, file and network utilities requested

1. **Battery information.** Show battery level, charging state and source, status, temperature and voltage. Display current, charge counter and cycle count when the OS and hardware report them. Show unavailable values explicitly. Android's coarse health status must not be presented as a measured battery capacity percentage. [Android BatteryManager](https://developer.android.com/reference/android/os/BatteryManager)
2. **File manager.** Let the user select a folder through the Android system picker, browse it and use supported create, rename, copy, move and delete actions with meaningful cancellation and error states. Extend the current document bridge with scoped directory grants. [Android document access](https://developer.android.com/training/data-storage/shared/documents-files)
3. **Archive manager.** Create ZIP archives from selected files, list ZIP and RAR contents and extract selected entries to a chosen folder. Enforce bounded output and contain each file within its selected destination. Review independent RAR creation support and licensing as a separate requirement. The current PDF dependency for ZIP output does not establish RAR support. [libarchive format support](https://www.libarchive.org/)

4. **Device information dashboard.** Show phone model, Android version, available sensors and camera capabilities reported to the app. Label unavailable fields.
5. **IP lookup.** Classify addresses locally. Review a network provider and data disclosures separately for public IP ownership or approximate location.
6. **Storage analysis.** Show used and available capacity, and a breakdown of the selected folders by file size and type.
7. **Storage cleaner.** Reuse the analysis to show candidates and bytes before the user confirms deletion of specific files.

## Six sensor features selected for implementation

The owner selected six and removed hands-free recipe navigation after reviewing the list. The order below is a proposed development sequence.

| Order | User interaction                                                                            | Acceptance on a phone                                                                                                                              |
| ----- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Pick a target tilt angle; hear a cue when the stand reaches it. Extend Level & Angle.       | Check a known angle after zero calibration. Use tolerance and hysteresis so sensor noise produces one cue.                                         |
| 2     | Capture left, middle and right illuminance readings across a desk. Extend Light Meter.      | Display three labeled readings in lux and identify ties. Keep phone orientation consistent.                                                        |
| 3     | Compare tabletop vibration in two setups. Extend Vibration Meter.                           | Use equal capture windows, show RMS linear acceleration and distinguish an incomplete capture from a zero reading.                                 |
| 4     | Set a pressure reference downstairs and finish upstairs. Extend Barometer & Altitude.       | Show approximate relative rise with units, current sensor availability and a reset. Check on a stairwell.                                          |
| 5     | Compare the magnetic field with and without a phone case. Extend Compass.                   | Display two field magnitudes and their difference at the same position and orientation. Avoid attributing the difference definitively to the case. |
| 6     | Pluck a guitar string, see its nearest standard tuning note and whether to tune up or down. | Process microphone samples locally, release capture on leaving the tool and test against known pitches.                                            |

[Android environment sensors](https://developer.android.com/develop/sensors-and-location/sensors/sensors_environment) · [Android position sensors](https://developer.android.com/develop/sensors-and-location/sensors/sensors_position)

## Current camera scope

The owner chose simple, local image operations for the first camera batch. Start with an image from the existing file picker, manually mark four paper corners, correct perspective and export a PDF using the current PDF Converter. The next candidates are an ID-photo crop and print sheet, and aligning before-and-after images. These are scoped proposals. They do not yet ship in the atlas.

Defer automatic text extraction, receipt interpretation, recognizing arbitrary goods and any custom model training. A manually entered unit-price calculation can use the existing comparer. The source photo, reviewable fields and manual corrections would remain important if OCR is revisited later. Pretrained Bengali and English recognition data are available for a future evaluation. [Tesseract language data](https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html)

## Ten additional camera concepts for discussion

1. **Document scan to PDF.** Detect a paper outline, allow manual corner adjustment, straighten the image and save multiple pages. Could extend PDF Converter.
2. **Copy printed text.** Photograph a notice, review recognized Bangla or English lines and copy the selected text. Verify script coverage and offline model size before selecting tooling.
3. **Barcode shopping list.** Associate an unfamiliar product barcode with a name locally, and increment its quantity on subsequent scans.
4. **Utility meter readings.** Confirm the recognized digits and compare them with the previous confirmed reading to show consumption.
5. **Expiry date reminder.** Confirm the recognized date and choose when to receive a notification.
6. **Compare two colors.** Sample two points from the same frame under the same lighting and show an approximate color difference.
7. **ID photo framing and print sheet.** Use a size chosen by the user, position the face with guides and lay out multiple copies for printing.
8. **Aligned before-and-after photos.** Overlay the previous shot as a guide for photographing a repair, room or plant from the same viewpoint.
9. **Signature cutout.** Photograph one's own signature on plain paper and preview a transparent PNG before exporting.
10. **Count visible objects.** Mark separated, similar objects, allow tapping to correct missing or extra detections, and display the corrected count.

The current shortlist above records the selection across these ten proposals. Live capture would require revisiting the current camera-permission decision.

## Five additional everyday camera workflows

- Compare unit prices from two shelf labels. Confirm package sizes and prices before reusing Unit Price Comparer.
- Capture event details from an invitation. Review the date, time and location before generating an .ics file.
- Capture a contact from a business card. Review names, numbers and email addresses before exporting a .vcf file.
- Split a photographed restaurant receipt by dish. Confirm each line, assign diners and divide shared items and service charges.
- Save a device model and serial number from its label. Support user-controlled local saving, retrieval and deletion.

These workflows can extend existing or proposed tools. They are not five approved additions to the release manifest.

## Implementation decisions to make

- **Permission-free prototypes.** Frame spacing, materials estimates, expense settlement and savings calculations can be tested with known numerical examples. Screen-ruler accuracy needs physical calibration. The QR and redaction ideas can use the existing scoped file picker.
- **Location.** GPS speed, coordinates and parking require a decision on foreground location access. The current manifest policy rejects location permissions. Define approximate, denied, stale and unavailable states before enabling these tools. [Android location permissions](https://developer.android.com/develop/sensors-and-location/location/permissions) · [Location readings](https://developer.android.com/reference/android/location/Location)
- **Camera.** Live camera measurement and magnification require a camera-permission decision. For measurement, an optional ARCore implementation can use surface hit positions to estimate dimensions. Check support and tracking quality and validate accuracy on real phones. [ARCore hit tests](https://developers.google.com/ar/develop/hit-test) · [AR Optional apps](https://developers.google.com/ar/develop/java/enable-arcore)
