import { Navigate, Route, Routes } from "react-router-dom";
import AdminHome from "./Containers/Admin/AdminHome/AdminHome";
import Login from "./Containers/Login/Login";
import Alerts from "./Components/UI/Alerts/Alerts";
import UserHome from "./Containers/User/UserHome/UserHome";
import { jwtDecode } from "jwt-decode";
import { useAppSelector } from "./app/hooks";
import SupervisorHome from "./Containers/Supervisor/SupervisorHome/SupervisorHome";
import './App.css';
import CreateEditUser from "./Containers/Admin/CreateUser/CreateEditUser";
import Users from "./Containers/Admin/Users/Users";

function App() {
  const { user } = useAppSelector(state => state.userState);
  
  const routes = {
    nonAuth: <>
      <Route
        path='/login'
        element={<Login/>}
      /></>,
    user: <>
      <Route
        path='/home'
        element={<UserHome/>}
      /></>,
    supervisor: <>
      <Route
        path='/home'
        element={<SupervisorHome/>}
      />
    </>,
    admin: <>
      <Route
        path='/home'
        element={<AdminHome/>}
      />
      <Route
        path='/create-user'
        element={<CreateEditUser/>}
      />
      <Route
        path='/users'
        element={<Users/>}
      />
      <Route
        path='/edit-user/:id'
        element={<CreateEditUser isEdit/>}
      />
    </>
  };
  
  return (
    <div className='App'>
      <Alerts/>
      <Routes>
        <Route
          path='*'
          element={<Navigate
            to={`/${!!user ? 'home' : 'login'}`}
            replace
          />}
        />
        {!user && routes.nonAuth}
        {!!user && routes[jwtDecode(user.access || '')?.role || 'nonAuth']}
      </Routes>
    </div>
  );
}

export default App;
