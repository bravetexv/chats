const { app } = require('electron');

console.log('App loaded:', !!app);

app.whenReady().then(() => {
    console.log('App is ready!');
    app.quit();
});
