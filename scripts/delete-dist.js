const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

try {
    if (fs.existsSync(distPath)) {
        fs.rmSync(distPath, { recursive: true, force: true });
        console.log('✅ dist deleted successfully');
    } else {
        console.log('⚠️ dist folder does not exist');
    }
} catch (error) {
    console.error('❌ Error deleting dist:', error.message);
    process.exit(1);
}

