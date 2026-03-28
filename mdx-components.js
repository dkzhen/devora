import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';

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
        ...components,
    };
}

export const useMDXComponents = getMDXComponents;

