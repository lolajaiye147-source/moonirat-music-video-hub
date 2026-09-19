UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
    'application/vnd.apple.mpegurl',
    'application/x-mpegURL',
    'video/mp2t'
]
WHERE id = 'videos';