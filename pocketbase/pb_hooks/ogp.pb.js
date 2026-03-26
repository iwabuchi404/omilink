console.log(`[OGP Hook] Loading ogp.pb.js...`);

// 1. Automatic fetch after creation
onRecordAfterCreateSuccess(function(e) {
    var record = e.record;
    if (!record || record.get("type") !== "bookmark" || !record.get("url") || record.get("ogp_fetched") === true) {
        return;
    }

    var url = record.get("url");
    console.log(`[OGP Hook] Auto-fetching for: ${url}`);

    // Define internal fetch logic (duplicated for scope safety)
    var fetchInfo = (function(targetUrl) {
        try {
            var res = $http.send({
                url: targetUrl,
                method: "GET",
                timeout: 5000,
                headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" }
            });
            if (res.statusCode >= 200 && res.statusCode < 300 && res.raw) {
                var html = res.raw;
                var extract = function(regex) {
                    var m = html.match(regex);
                    return m && m[1] ? m[1].trim() : null;
                };
                var decode = function(s) {
                    return s ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : s;
                };
                var title = decode(extract(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) || extract(/<title[^>]*>([^<]+)<\/title>/i));
                var desc = decode(extract(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i) || extract(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i));
                var image = decode(extract(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i));
                
                // Improved favicon extraction
                var favicon = null;
                var iconTags = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi);
                if (iconTags) {
                    for (var i = 0; i < iconTags.length; i++) {
                        var h = iconTags[i].match(/href=["']([^"']+)["']/i);
                        if (h && h[1]) { favicon = decode(h[1]); break; }
                    }
                }
                if (!favicon) {
                    var hr = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["'][^>]*>/i);
                    if (hr) favicon = decode(hr[1]);
                }
                
                var rootMatch = targetUrl.match(/^(https?:\/\/[^\/]+)/);
                var rootUrl = rootMatch ? rootMatch[1] : "";

                if (image && image.indexOf("/") === 0) {
                    if (rootUrl) image = rootUrl + image;
                }
                
                if (favicon) {
                    if (favicon.indexOf("/") === 0) {
                        if (rootUrl) favicon = rootUrl + favicon;
                    } else if (favicon.indexOf("http") !== 0) {
                        // Handle relative path like "favicon.ico"
                        favicon = rootUrl + (favicon.indexOf("/") === 0 ? "" : "/") + favicon;
                    }
                } else if (rootUrl) {
                    favicon = rootUrl + "/favicon.ico";
                }

                return { title: title, description: desc, image: image, favicon: favicon };
            }
        } catch (err) { console.error(`[OGP Hook] Fetch error: ${err}`); }
        return null;
    })(url);

    if (fetchInfo) {
        if (fetchInfo.title && !record.get("title")) record.set("title", fetchInfo.title);
        if (fetchInfo.description && !record.get("description")) record.set("description", fetchInfo.description);
        if (fetchInfo.image) record.set("og_image_url", fetchInfo.image);
        if (fetchInfo.favicon) record.set("favicon_url", fetchInfo.favicon);
    }

    record.set("ogp_fetched", true);
    try {
        $app.save(record);
    } catch (err) {
        console.error(`[OGP Hook] Save error: ${err}`);
    }
}, "items");

// 2. API endpoint for manual fetch
routerAdd("POST", "/ogp", function(e) {
    try {
        var info = e.requestInfo();
        var targetUrl = (info.body || {}).url;
        console.log(`[OGP Route] Request for: ${targetUrl}`);

        if (!targetUrl) {
            return e.json(400, { error: "URL is required" });
        }

        // Define internal fetch logic (duplicated for scope safety)
        var data = (function(url) {
            try {
                var res = $http.send({
                    url: url,
                    method: "GET",
                    timeout: 5000,
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36" }
                });
                if (res.statusCode >= 200 && res.statusCode < 300 && res.raw) {
                    var html = res.raw;
                    var extract = function(regex) {
                        var m = html.match(regex);
                        return m && m[1] ? m[1].trim() : null;
                    };
                    var decode = function(s) {
                        return s ? s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : s;
                    };
                    var title = decode(extract(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i) || extract(/<title[^>]*>([^<]+)<\/title>/i));
                    var desc = decode(extract(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i) || extract(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i));
                    var image = decode(extract(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i));
                    
                    var favicon = null;
                    var iconTags = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>/gi);
                    if (iconTags) {
                        for (var i = 0; i < iconTags.length; i++) {
                            var h = iconTags[i].match(/href=["']([^"']+)["']/i);
                            if (h && h[1]) { favicon = decode(h[1]); break; }
                        }
                    }
                    if (!favicon) {
                        var hr = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["'][^>]*>/i);
                        if (hr) favicon = decode(hr[1]);
                    }
                    
                    var rootMatch = url.match(/^(https?:\/\/[^\/]+)/);
                    var rootUrl = rootMatch ? rootMatch[1] : "";

                    if (image && image.indexOf("/") === 0) {
                        if (rootUrl) image = rootUrl + image;
                    }

                    if (favicon) {
                        if (favicon.indexOf("/") === 0) {
                            if (rootUrl) favicon = rootUrl + favicon;
                        } else if (favicon.indexOf("http") !== 0) {
                            favicon = rootUrl + (favicon.indexOf("/") === 0 ? "" : "/") + favicon;
                        }
                    } else if (rootUrl) {
                        favicon = rootUrl + "/favicon.ico";
                    }

                    return { title: title, description: desc, image: image, favicon: favicon };
                }
            } catch (err) { console.error(`[OGP Route] Fetch error: ${err}`); }
            return null;
        })(targetUrl);

        if (!data) {
            return e.json(502, { error: "Failed to fetch OGP data" });
        }

        return e.json(200, data);
    } catch (err) {
        console.error(`[OGP Route] Runtime error: ${err}`);
        return e.json(500, { error: err.toString() });
    }
});








