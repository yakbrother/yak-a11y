import sirv from 'sirv';
import http from 'http';

const serve = sirv('examples', {
    dev: true,
    single: false,
    etag: true
});

const server = http.createServer((req, res) => {
    serve(req, res);
});

const port = 3000;
server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('\nTest pages available:');
    console.log(`- Perfect example: http://localhost:${port}/perfect.html`);
    console.log(`- Image/Form issues: http://localhost:${port}/image-form-issues.html`);
    console.log(`- Navigation issues: http://localhost:${port}/navigation-issues.html`);
    console.log(`- Contrast/ARIA issues: http://localhost:${port}/contrast-aria-issues.html`);
    console.log('\nRun accessibility checks using:');
    console.log('yak-a11y http://localhost:3000/perfect.html');
});
