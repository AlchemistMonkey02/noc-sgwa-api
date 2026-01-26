
const path = require('path');
const fs = require('fs');

// Inputs:
// Case 1: Windows style path stored in DB (the problem case)
const storedPathWindows = 'uploads\\123\\doc.pdf';

// Case 2: Unix style path stored in DB (future/correct case)
const storedPathUnix = 'uploads/123/doc.pdf';

function verify(storedPath) {
    console.log(`\nTesting stored path: ${storedPath}`);

    // Logic from controller:
    const normalizedPath = storedPath.replace(/\\/g, '/');
    const absolutePath = path.resolve(normalizedPath);

    console.log(`Normalized: ${normalizedPath}`);
    console.log(`Resolved Absolute: ${absolutePath}`);

    // Assertion (Platform dependent, but we check if it looks right)
    if (process.platform === 'win32') {
        // Expects backslashes in absolute path
        if (absolutePath.includes('uploads\\123\\doc.pdf')) {
            console.log("SUCCESS: Path resolved correctly on Windows");
        } else {
            console.log("WARNING: Path resolution check might have failed or path format unexpected.");
        }
    } else {
        // Linux expectations
        if (!absolutePath.includes('\\')) {
            console.log("SUCCESS: Path has no backslashes");
        }
    }
}

verify(storedPathWindows);
verify(storedPathUnix);
