import { Outlet } from 'react-router-dom';
import ExternalWidget from '../components/ExternalWidget';

const PublicLayout = () => {
    return (
        <>
            <ExternalWidget />
            <Outlet />
        </>
    );
};

export default PublicLayout;
