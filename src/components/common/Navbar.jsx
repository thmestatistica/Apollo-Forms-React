import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  HomeIcon, 
  CalendarIcon, 
  ClipboardDocumentCheckIcon, 
  ClockIcon, 
  DocumentTextIcon, 
  ArrowRightOnRectangleIcon, 
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon, 
  UserCircleIcon,
  PencilSquareIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import ApolloLogo from '../../assets/logo_apollo.png';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [openMobileSubmenu, setOpenMobileSubmenu] = useState(null); 
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Esconder Navbar em páginas de formulário (exceto visualização)
    const isFormPage = location.pathname.includes('/formulario/') && !location.pathname.includes('visualizar-formulario');
    
    if (isFormPage) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/login/terapeuta');
    };

    // --- Permissões ---
    const EDITORES_PERMITIDOS = [8, 43, 17, 13, 15, 40, 38, 5, 12, 2];
    const podeEditar = EDITORES_PERMITIDOS.includes(Number(user?.profissionalId));

    const GESTAO_PERMITIDOS = [8, 17, 13, 15, 40, 43, 41, 5]; 
    const podeAcessarGestao = GESTAO_PERMITIDOS.includes(Number(user?.profissionalId));

    const navigation = [
        { 
            name: 'Início', 
            href: '/forms-terapeuta/tela-inicial', 
            icon: HomeIcon,
            activeColor: 'bg-purple-100 text-purple-900 border-purple-700',
            baseColor: 'bg-purple-50 text-purple-700 hover:bg-purple-100/80',
        },
        { 
            name: 'Agenda Semanal', 
            icon: CalendarIcon,
            activeColor: 'bg-indigo-100 text-indigo-900 border-indigo-700',
            baseColor: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80',
            childActive: 'bg-indigo-100 text-indigo-900 font-bold border-indigo-500', 
            childHover: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80',
            children: [
                { name: 'Profissional', href: '/forms-terapeuta/agenda-semanal-terapeuta', icon: EyeIcon },
                { name: 'Paciente', href: '/forms-terapeuta/agenda-semanal-paciente', icon: UserCircleIcon }
            ]
        },
        { 
            name: 'Jornada', 
            href: '/forms-terapeuta/jornada', 
            icon: ClipboardDocumentCheckIcon,
            activeColor: 'bg-blue-100 text-blue-800 border-blue-600',
            baseColor: 'bg-blue-50 text-blue-600 hover:bg-blue-100/80',
        },
        { 
            name: 'Pendências', 
            href: '/forms-terapeuta/lancamentos-pendencias', 
            icon: ClockIcon,
            activeColor: 'bg-red-100 text-red-800 border-red-600',
            baseColor: 'bg-red-50 text-red-600 hover:bg-red-100/80',
        },

        ...(podeAcessarGestao ? [{ 
            name: 'Gestão', 
            href: '/forms-terapeuta/gestao', 
            icon: ChartBarIcon,
            activeColor: 'bg-teal-100 text-teal-800 border-teal-600',
            baseColor: 'bg-teal-50 text-teal-600 hover:bg-teal-100/80',
        }] : []),
        
        { 
            name: 'Formulários', 
            icon: DocumentTextIcon,
            activeColor: 'bg-orange-100 text-orange-800 border-orange-600',
            baseColor: 'bg-orange-50 text-orange-600 hover:bg-orange-100/80',
            childActive: 'bg-orange-100 text-orange-900 font-bold border-orange-500',
            childHover: 'bg-orange-50 text-orange-700 hover:bg-orange-100/80 hover:border-orange-300',
            children: [
                // "Editar Formulário" apenas para editores
                ...(podeEditar ? [{ 
                    name: 'Editar Formulário', 
                    href: '/forms-terapeuta/editar-formulario', 
                    icon: PencilSquareIcon,
                }] : []),
                { 
                    name: 'Visualizar Formulários', 
                    href: '/forms-terapeuta/visualizar-formularios', 
                    icon: EyeIcon,
                }
            ]
        },
    ];

    return (
        <nav className="bg-white shadow-md fixed w-full z-50 top-0 left-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                <div className="flex">
                    <div className="shrink-0 flex items-center">
                    <img className="h-8 w-auto" src={ApolloLogo} alt="Apollo Logo" />
                    </div>
                    <div className="hidden xl:ml-6 xl:flex xl:space-x-4 items-center">
                    {navigation.map((item) => {
                        const isChildActive = item.children?.some(child => location.pathname === child.href);
                        
                        return (
                        <div key={item.name} className="relative group/menu h-full flex items-center cursor-default">
                            {item.href ? (
                                <NavLink
                                to={item.href}
                                className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                    isActive || isChildActive
                                        ? `${item.activeColor} border-b-2`
                                        : `${item.baseColor}`
                                    }`
                                }
                                >
                                    <item.icon className="h-5 w-5 mr-1.5" />
                                    {item.name}
                                </NavLink>
                            ) : (
                                <span className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 cursor-default ${
                                    isChildActive 
                                        ? `${item.activeColor} border-b-2`
                                        : `${item.baseColor}`
                                }`}>
                                    <item.icon className="h-5 w-5 mr-1.5" />
                                    {item.name}
                                </span>
                            )}
                            
                            {/* Submenu Dropdown */}
                            {item.children && (
                                <div className="absolute top-[80%] left-0 w-56 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 transform translate-y-2 group-hover/menu:translate-y-0 z-50 overflow-hidden">
                                    {item.children.map(sub => (
                                        <NavLink 
                                            key={sub.name}
                                            to={sub.href}
                                            state={sub.state}
                                            className={({ isActive }) => 
                                                `flex items-center gap-3 px-4 py-3 text-sm text-gray-600 transition-all ${
                                                    isActive 
                                                        ? item.childActive || 'bg-apollo-50 text-apollo-700 font-bold border-l-4 border-apollo-300' 
                                                        : item.childHover || 'hover:bg-apollo-50 hover:text-apollo-600 border-l-4 border-transparent hover:border-apollo-300'
                                                }`
                                            }
                                        >
                                            {sub.icon && <sub.icon className="w-4 h-4" />}
                                            {sub.name}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    )})}
                    </div>
                </div>
                
                <div className="hidden xl:flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                        <UserCircleIcon className="h-5 w-5 text-gray-500" />
                        <span className="font-medium truncate max-w-[150px]">{user?.nome || 'Terapeuta'}</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Sair"
                    >
                        <ArrowRightOnRectangleIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="-mr-2 flex items-center xl:hidden">
                    <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    >
                    <span className="sr-only">Open main menu</span>
                    {isOpen ? (
                        <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                        <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                    </button>
                </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="xl:hidden bg-white border-b border-gray-200 shadow-lg absolute w-full left-0 z-40">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {navigation.map((item) => {
                        const hasChildren = !!item.children;
                        const isExpanded = openMobileSubmenu === item.name;
                        const isChildActive = item.children?.some(child => location.pathname === child.href);
                        const isActiveParent = (item.href ? location.pathname === item.href : false) || isChildActive;

                        return (
                            <div key={item.name} className="flex flex-col">
                                <div 
                                    onClick={() => {
                                        if (hasChildren) {
                                            setOpenMobileSubmenu(isExpanded ? null : item.name);
                                        } else {
                                            navigate(item.href);
                                            setIsOpen(false);
                                        }
                                    }}
                                    className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium cursor-pointer transition-colors select-none ${
                                        isActiveParent
                                        ? `${item.activeColor} border-l-4`
                                        : `${item.baseColor}`
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <item.icon className="h-5 w-5 mr-3" />
                                        {item.name}
                                    </div>
                                    {hasChildren && (
                                        <div className={`p-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                {/* Mobile Submenu */}
                                {hasChildren && isExpanded && (
                                    <div className="ml-8 mt-1 space-y-1 border-l-2 border-gray-100 pl-2 animate-fade-in-down">
                                        {item.children.map((sub) => (
                                            <NavLink
                                                key={sub.name}
                                                to={sub.href}
                                                state={sub.state}
                                                onClick={() => setIsOpen(false)}
                                                className={({ isActive }) =>
                                                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        isActive
                                                        ? item.childActive || 'text-apollo-600 bg-apollo-50 font-bold border-l-4 border-apollo-300' 
                                                        : item.childHover || 'text-gray-500 hover:text-apollo-600 hover:bg-apollo-50 border-l-4 border-transparent hover:border-apollo-300'
                                                    }`
                                                }
                                            >
                                                {sub.icon && <sub.icon className="h-4 w-4 mr-2" />}
                                                {sub.name}
                                            </NavLink>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    <div className="border-t border-gray-200 pt-4 pb-2 mt-2">
                        <div className="flex items-center px-3 mb-3">
                        <div className="shrink-0">
                            <UserCircleIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-3">
                            <div className="text-base font-medium leading-none text-gray-800">{user?.nome || 'Usuário'}</div>
                            <div className="text-sm font-medium leading-none text-gray-500 mt-1">{user?.email}</div>
                        </div>
                        </div>
                        <button
                        onClick={() => {
                            handleLogout(); 
                            setIsOpen(false);
                        }}
                        className="w-full text-left flex items-center px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-800 rounded-md"
                        >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" /> Sair
                        </button>
                    </div>
                </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
