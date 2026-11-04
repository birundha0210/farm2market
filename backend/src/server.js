import app from './app.js';

const port = process.env.PORT || 5000;

app.listen(port, '0.0.0.0', () => {
    console.log(`Farm2Market API listening on port ${port}`);
});