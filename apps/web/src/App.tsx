import { useQuery } from '@tanstack/react-query';
import { esCL } from '@faena/contracts';
import { api } from './api';
import { authQueryKeys } from './features/auth/query-keys';
import { LoginPage } from './features/auth/LoginPage';
import { Panel } from './features/layout/Panel';
import { PageState } from './components/PageState';

function App() {
  const me = useQuery({ queryKey: authQueryKeys.me, queryFn: api.me, retry: false });
  if (me.isPending)
    return <PageState title={esCL.auth.loadingTitle} text={esCL.auth.loadingText} />;
  if (me.isError || !me.data) return <LoginPage />;
  return <Panel user={me.data} />;
}

export default App;
