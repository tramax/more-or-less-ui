import { useEffect } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Coming } from './pages/Coming';
import { Landing } from './pages/Landing';
import { Principles } from './pages/Principles';
import { useRouter, type Route } from './router';

const TITLES: Record<Route['page'], string> = {
  home: 'more-or-less-ui',
  principles: 'Principles · more-or-less-ui',
  components: 'Components · more-or-less-ui',
  about: 'About · more-or-less-ui',
  'not-found': 'Not found · more-or-less-ui',
};

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'home':
      return <Landing />;
    case 'principles':
      return <Principles />;
    case 'components':
      return (
        <Coming
          title="Components"
          text="A card for each component: what it does differently, and why. Coming next."
        />
      );
    case 'about':
      return (
        <Coming
          title="About"
          text="The experience in human-computer interaction behind the choices."
        />
      );
    case 'not-found':
      return <Coming title="Not found" text="There is nothing at this address." />;
  }
}

export function App() {
  const { route } = useRouter();

  useEffect(() => {
    document.title = TITLES[route.page];
  }, [route.page]);

  return (
    <>
      <Header />
      <main>
        <Page route={route} />
      </main>
      <Footer />
    </>
  );
}
