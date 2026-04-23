import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from '@/components/docs/Callout';
import { ApiCard } from '@/components/docs/ApiCard';
import { Cards, Card } from '@/components/docs/Cards';
import { ModelTable } from '@/components/docs/ModelTable';

/**
 * @param {import('mdx/types').MDXComponents} [components]
 * @returns {import('mdx/types').MDXComponents}
 */
export function getMDXComponents(components) {
    return {
        ...defaultMdxComponents,
        Steps,
        Step,
        Tabs,
        Tab,
        Accordion,
        Accordions,
        Callout,
        ApiCard,
        Cards,
        Card,
        ModelTable,
        ...components,
    };
}

export const useMDXComponents = getMDXComponents;

