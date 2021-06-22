import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import classnames from "classnames";
import { join } from "path";
import { getDocs, formatDate, buildPageTree, getPage } from "../../lib/lib";
import Markdown from "../../components/Markdown";

const breadcrumbs = (posts, paths) => {
  const results = [
    <Link href="/">Urbit.org</Link>,
    <span className="px-1">/</span>,
    <Link href="/docs">Documentation</Link>,
  ];
  let thisLink = "/docs";
  for (const path of paths) {
    posts = posts.children[path];
    thisLink = join(thisLink, path);
    results.push(
      <span className="px-1">/</span>,
      <Link href={thisLink}>{posts.title}</Link>
    );
  }
  return results;
};

const childPages = (thisLink, children, level = 0) => (
  <ul className="pl-1">
    {Object.entries(children).map(([childSlug, child]) => (
      <li>{pageTree(join(thisLink, childSlug), child, level)}</li>
    ))}
  </ul>
);

const pageTree = (thisLink, tree, level = 0) => {
  const router = useRouter();
  const firstCrumb = "/" + router.asPath.split("/").slice(1).join("/");

  const thisPage = firstCrumb.includes(thisLink);
  const [isOpen, toggleTree] = useState(thisPage);

  const activeClasses = classnames({
    hidden: !isOpen,
  });

  const headerClass = classnames({
    "text-gray": !thisPage,
  });
  return (
    <>
      <span
        className={
          "font-medium text-lg cursor-pointer hover:text-black " + headerClass
        }
        onClick={() => toggleTree(!isOpen)}
      >
        {tree.title}
      </span>
      <div className={activeClasses}>
        <ul className={"pl-1"}>
          {tree.pages
            .sort((a, b) => a.weight - b.weight)
            .map(({ title, slug }) => (
              <li className="font-thin py-1">
                <Link href={join(thisLink, slug)}>{title}</Link>
              </li>
            ))}
        </ul>
        {childPages(thisLink, tree.children, level + 1)}
      </div>
    </>
  );
};

function Sidebar(props) {
  return (
    <div className="flex flex-col w-72 bg-wall max-h-screen h-screen">
      <header className="flex flex-shrink-0 justify-between items-center pl-12 pt-12 pb-8">
        <Link href="/">
          <a className="type-ui text-gray">Urbit.org</a>
        </Link>
      </header>
      <div className="overflow-y-scroll p-12 pt-16">
        {props.children}
        <div className="pb-32" />
      </div>
    </div>
  );
}

function ContentArea(props) {
  return (
    <div className="w-full">
      <header className="flex justify-between items-center px-24 pt-12 pb-8">
        <div className="type-ui">Urbit Documentation</div>
        <button className="button-sm bg-wall text-gray">
          Search Urbit.org<div className="ml-4 text-lightGray">⌘K</div>
        </button>
      </header>
      <div className="px-24 pb-24 pt-16 flex flex-col w-full max-h-screen h-screen overflow-y-scroll">
        <div className="type-ui text-lightGray">{props.breadcrumbs}</div>
        <h2 className="mb-16 mt-4">{props.title}</h2>
        {props.children}
        <div className="pb-32" />
      </div>
    </div>
  );
}

export default function DocsLayout({ posts, data, content, params }) {
  return (
    <>
      <Head>
        <title>{data.title} / Documentation / Urbit.org</title>
      </Head>
      <div className="flex w-screen h-screen min-h-screen w-screen overflow-hidden">
        <Sidebar>{childPages("/docs", posts.children)}</Sidebar>
        <ContentArea
          breadcrumbs={breadcrumbs(posts, params.slug.slice(0, -1))}
          title={data.title}
        >
          <Markdown post={{ content: content }} />
        </ContentArea>
      </div>
    </>
  );
}

export async function getStaticProps({ params }) {
  const posts = buildPageTree(join(process.cwd(), "content/docs"));
  const { data, content } = getPage(
    join(process.cwd(), "content/docs", params.slug.join("/"))
  );
  return { props: { posts, data, content, params } };
}

export async function getStaticPaths() {
  const posts = buildPageTree(join(process.cwd(), "content/docs"));
  const slugs = [];
  const allHrefs = (thisLink, tree) => {
    slugs.push(thisLink, ...tree.pages.map((e) => join(thisLink, e.slug)));
    allHrefsChildren(thisLink, tree.children);
  };

  const allHrefsChildren = (thisLink, children) => {
    Object.entries(children).map(([childSlug, child]) => {
      allHrefs(join(thisLink, childSlug), child);
    });
  };
  allHrefs("/docs", posts);
  return {
    paths: slugs.filter((e) => e !== "/docs"),
    fallback: false,
  };
}