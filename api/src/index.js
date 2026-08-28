// Azure Functions loads this CommonJS entry in managed Static Web Apps before
// routing any request. Keep the bootstrap explicit: a failed module load would
// otherwise surface as the platform's headerless "Backend call failure".
require('./functions/gallery.js');
