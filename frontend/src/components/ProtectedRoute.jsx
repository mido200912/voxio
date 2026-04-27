import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

const ProtectedRoute = ({ children }) => {
    const { user, loading, isAuthChecked } = useAuth();

    if (!isAuthChecked || loading) {
        return <PageLoader />;
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
