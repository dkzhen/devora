// @ts-nocheck
import * as __fd_glob_2 from "../content/docs/temp-mail/index.mdx?collection=docs"
import * as __fd_glob_1 from "../content/docs/api-keys/index.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/index.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {}, {"index.mdx": __fd_glob_0, "api-keys/index.mdx": __fd_glob_1, "temp-mail/index.mdx": __fd_glob_2, });