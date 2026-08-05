import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth.jsx";
import { useFormContext } from "../../hooks/useFormContext";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const TelaInicialMedicoParceiro = () => {

    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login/medico-parceiro');
    };

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">

                <div className="bg-linear-to-r from-apollo-200 to-apollo-500 p-8 text-white">
                    <div className="w-full flex justify-between">
                        <h1 className="text-4xl font-extrabold">
                            Painel do Médico Parceiro
                        </h1>
                        <button
                            onClick={() => {
                                handleLogout();
                            }}
                            className="w-fit text-left flex items-center px-6 py-3 text-base font-medium bg-white text-red-600 hover:bg-red-50 hover:text-red-800 rounded-xl"
                        >
                            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" /> Sair
                        </button>
                    </div>

                    <p className="mt-2 text-lg opacity-90">
                        Bem-vindo, {user?.usuario?.nome || ""}
                    </p>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-bold text-gray-700 mb-6">
                        Acessos rápidos
                    </h2>

                    <div className="grid md:grid-cols-1 gap-6">
                        <NavigationButton linkTo="/forms-medico-parceiro/jornada" title="Jornada do paciente" description="Acompanhe histórico e evolução dos pacientes." icon="👤" />
                    </div>



                </div>

            </div>
        </div>
    );
};

const NavigationButton = ({ title, description, icon, linkTo = "/forms-medico-parceiro/tela-inicial" }) => {

    return (
        <NavLink to={linkTo} className="group text-left bg-gray-50 border border-gray-200 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-apollo-400">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 p-2 rounded-xl bg-apollo-100 flex items-center justify-center text-3xl group-hover:scale-110 transition">
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-xl text-gray-800">
                        {title}
                    </h3>

                    <p className="text-gray-500 mt-1">
                        {description}
                    </p>
                </div>
            </div>
        </NavLink>
    );
};

export default TelaInicialMedicoParceiro;
