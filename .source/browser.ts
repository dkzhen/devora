// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "api-keys/index.mdx": () => import("../content/docs/api-keys/index.mdx?collection=docs"), "temp-mail/index.mdx": () => import("../content/docs/temp-mail/index.mdx?collection=docs"), }),
};
export default browserCollections;