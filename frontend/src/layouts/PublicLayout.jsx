import { Outlet } from 'react-router-dom';
import VOXIOChatWidget from '../components/ui/VOXIOChatWidget';

const PublicLayout = () => {
    return (
        <>
            <VOXIOChatWidget />
            <Outlet />
        </>
    );
};

export default PublicLayout;
