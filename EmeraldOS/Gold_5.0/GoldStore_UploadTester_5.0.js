api.write('<h2>Gold Store Upload Tester 5.0</h2><p>This is a JS-only test app.</p>');
let notes = api.load('notes', '');
api.write('<textarea id=goldNotes rows=6 style=width:100% placeholder="Type notes here">'+notes+'</textarea>');
api.button('Save Notes', () => { api.save('notes', document.getElementById('goldNotes').value); api.notify('Upload Tester', 'Notes saved locally.'); });
api.button('Export Notes', () => { api.exportText('gold-upload-tester-notes.txt', document.getElementById('goldNotes').value); });
api.button('Open Settings', () => api.open('settings'));
