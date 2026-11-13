import { useEffect } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';
import { Coming } from './pages/Coming';
import { Landing } from './pages/Landing';
import { Principles } from './pages/Principles';
import { useRouter, type Route } from './router';

const TITLES: Record<Route['page'], string> = {
  home: 'More or Less UI',
  principles: 'Principles · More or Less UI',
  about: 'About · More or Less UI',
  'not-found': 'Not found · More or Less UI',
};

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'home':
      return <Landing />;
    case 'principles':
      return <Principles />;
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
