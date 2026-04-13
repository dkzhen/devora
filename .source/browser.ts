// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"index.mdx": () => import("../content/docs/index.mdx?collection=docs"), "api-references/ai-models.mdx": () => import("../content/docs/api-references/ai-models.mdx?collection=docs"), "api-references/airdrop-v1.mdx": () => import("../content/docs/api-references/airdrop-v1.mdx?collection=docs"), "api-references/index.mdx": () => import("../content/docs/api-references/index.mdx?collection=docs"), "api-keys/index.mdx": () => import("../content/docs/api-keys/index.mdx?collection=docs"), "api-references/temp-mail/accounts.mdx": () => import("../content/docs/api-references/temp-mail/accounts.mdx?collection=docs"), "api-references/temp-mail/index.mdx": () => import("../content/docs/api-references/temp-mail/index.mdx?collection=docs"), "api-references/temp-mail/messages.mdx": () => import("../content/docs/api-references/temp-mail/messages.mdx?collection=docs"), }),
};
export default browserCollections;