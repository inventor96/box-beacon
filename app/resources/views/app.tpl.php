<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#ffffff" />
    {{ raw:$tags->preload }}
    {{ raw:$tags->css }}
    {{ raw:$tags->js }}
</head>
<body>
    <div id="app" data-page="{{ attribute:$page }}"></div>
</body>
</html>