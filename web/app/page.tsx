import NewsSection from "./components/NewsSection";

interface HomeProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function Home(props: HomeProps) {
  const query = await props.searchParams

  return (
    <>
      {/* NewsSection is now a server component */}
      <NewsSection searchParams={query} />
    </>
  );
}

export default Home;