import { MenuIcons } from './menu-icons';

export const getMenuCategories = (MenuIcons) => [
    {
        label: 'Main',
        items: [
            {
                name: 'Dashboard',
                href: '/',
                icon: MenuIcons.Dashboard
            },
            {
                name: 'App Library',
                href: '/app-library',
                icon: MenuIcons.AppLibrary
            },
        ]
    },
    {
        label: 'Web3',
        items: [
            {
                name: 'Airdrops',
                href: '/airdrops',
                icon: MenuIcons.Airdrops
            },
            {
                name: 'Web3 Projects',
                href: '/web3-projects',
                icon: MenuIcons.Web3Projects
            },
        ]
    },
    // Will add more categories
];
