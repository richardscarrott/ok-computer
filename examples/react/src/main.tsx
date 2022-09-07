import { Pane, Tab, Tablist } from 'evergreen-ui';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
  useLocation
} from 'react-router-dom';
import BasicForm from './components/basic-form';
import StackedErrorMessagesForm from './components/stacked-error-messages-form';

const Layout: React.FunctionComponent = () => {
  const location = useLocation();
  return (
    <>
      <Pane
        display="flex"
        maxWidth="1024px"
        marginLeft="auto"
        marginRight="auto"
      >
        <Tablist marginBottom={16} marginRight={24}>
          {[
            { label: 'Basic', path: '/' },
            { label: 'Stacked error messages', path: '/stacked-error-messages' }
            // { label: 'Password validator', path: '/' },
            // { label: 'Form-level error messages', path: '/' },
            // { label: 'Nested fields', path: '/' },
            // { label: 'Array fields', path: '/' },
            // { label: 'Form builder', path: '/' }
          ].map(({ label, path }, i) => (
            <Tab
              key={i}
              direction="vertical"
              is={Link}
              to={path}
              isSelected={path === location.pathname}
            >
              {label}
            </Tab>
          ))}
        </Tablist>
        <Pane padding={16} background="tint1" flex="1">
          <Outlet />
        </Pane>
      </Pane>
    </>
  );
};

const router = createBrowserRouter([
  {
    path: '/',
    errorElement: <>500</>,
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <BasicForm />
          },
          {
            path: 'stacked-error-messages',
            element: <StackedErrorMessagesForm />
          },
          {
            path: '*',
            element: <div>404</div>
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
