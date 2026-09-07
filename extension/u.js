function normalizeNoticeUrl(rawUrl) {
    if (!rawUrl) {
        return null
    }

    var candidate = rawUrl.trim()
    if (!candidate) {
        return null
    }
    if (!/^https?:\/\//i.test(candidate)) {
        candidate = 'http://' + candidate
    }

    try {
        return new URL(candidate).href
    } catch (error) {
        return null
    }
}

function parseNoticeEntries(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html')
    var entries = []

    doc.querySelectorAll('.infringing_url').forEach(function (element) {
        var text = element.textContent.replace(/\s+/g, ' ').trim()
        var countMatch = text.match(/[-–—•]\s*(\d+)\s*$/)
        var link = element.querySelector('a[href]')
        var rawUrl = link
            ? (link.getAttribute('href') || link.textContent)
            : text.replace(/\s*[-–—•]\s*\d+\s*$/, '')
        var href = normalizeNoticeUrl(rawUrl)

        if (!countMatch || !href) {
            return
        }

        entries.push({
            count: countMatch[1],
            href: href,
            label: href.replace(/^https?:\/\//i, '').replace(/\/$/, '')
        })
    })

    return entries
}

function appendNoticeEntry(container, entry) {
    var group = $('#l' + entry.count)
    if (group.length < 1) {
        container.prepend('<div id="l' + entry.count + '" data-num="' + entry.count + '"></div>')
        group = $('#l' + entry.count)
    }

    var result = $('<div>', {class: 'g'})
    $('<a>', {
        href: entry.href,
        rel: 'noopener noreferrer',
        target: '_blank',
        text: entry.label + ' (' + entry.count + ' URLs)'
    }).appendTo(result)
    group.append(result)
}

$(function () {
    if (window.location.href.indexOf('//www.google') === -1) {
        return
    }
    $('#search div.g').last().after('<div id="cc"></div>')
    var s = $('#cc')

    $('div i > a').each(function (i, a) {
        if (a.href === 'https://www.google.com/support/answer/1386831') return;
        setTimeout(function () {
            $.ajax({
                type: 'GET',
                url: a.href,
                dataType: 'html',
                success: function (data) {
                    var hm = {}
                    var links = parseNoticeEntries(data)
                    for (const entry of links) {
                        if (entry.href in hm) {
                            continue
                        }
                        hm[entry.href] = 1
                        appendNoticeEntry(s, entry)
                    }
                    var divs = $('div[data-num]', s)
                    divs.sort(function (a, b) {
                        return b.dataset.num - a.dataset.num
                    })
                    s.append(divs)
                },
                error: function (e, err) {
                    console.log(e, err);
                },
                xhr: function () {
                    var xhr = jQuery.ajaxSettings.xhr();
                    var setRequestHeader = xhr.setRequestHeader;
                    xhr.setRequestHeader = function (name, value) {
                        if (name == 'X-Requested-With') return;
                        setRequestHeader.call(this, name, value);
                    }
                    return xhr;
                },

            });
        }, i * 2000);
    })


});
