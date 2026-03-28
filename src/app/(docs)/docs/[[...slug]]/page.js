import { source } from '@/lib/docs-source';
import {
    DocsPage,
    DocsBody,
    DocsTitle,
    DocsDescription,
} from 'fumadocs-ui/page';
import { getMDXComponents } from '../../../../../mdx-components';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const page = source.getPage(slug);
    if (!page) notFound();

    return {
        title: `${page.data.title} | Devora Docs`,
        description: page.data.description,
    };
}

export default async function Page({ params }) {
    const { slug } = await params;
    const page = source.getPage(slug);
    if (!page) notFound();

    const MDX = page.data.body;

    return (
        <DocsPage toc={page.data.toc}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDX components={getMDXComponents()} />
            </DocsBody>
        </DocsPage>
    );
}
