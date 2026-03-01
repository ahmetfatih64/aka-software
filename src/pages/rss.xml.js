import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const blog = await getCollection('blog', ({ data }) => {
        return data.draft !== true;
    });

    return rss({
        title: 'AKA Software Blog',
        description: 'Yazılım, AI ve Teknoloji Danışmanlığı Üzerine Gelişmeler',
        site: context.site || 'https://akasoftware.com',
        items: blog.map((post) => ({
            title: post.data.title,
            pubDate: post.data.publishDate,
            description: post.data.description,
            // Compute RSS link from post `slug`
            // This example assumes all posts are rendered as `/blog/[slug]` routes
            link: `/blog/${post.slug}/`,
        })),
    });
}
