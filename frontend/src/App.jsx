import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WorkspacePage from './pages/WorkspacePage';
import PageEditor from './pages/PageEditor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
           <Route index element={<WorkspacePage />} />
           <Route path="workspace/:workspaceId" element={<WorkspacePage />} />
           <Route path="workspace/:workspaceId/:pageId" element={<PageEditor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
