import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import logo from '../../assets/logo-light.png' 

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Colonne 1 : Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <img src={logo} alt="Eventify" className="h-8 w-auto grayscale opacity-80 hover:grayscale-0 transition-all" />
                {/* <span className="font-bold text-lg text-slate-800"></span> */}
            </div>
            <p className="text-white text-sm leading-relaxed">
              La plateforme de billetterie nouvelle génération pour créer, découvrir et vivre des expériences inoubliables.
            </p>
          </div>

          {/* Colonne 2 : Liens */}
          <div>
            <h4 className="font-bold text-white mb-4">Découvrir</h4>
            <ul className="space-y-2 text-sm text-white">
                <li><a href="#" className="hover:text-green-600 transition">Concerts</a></li>
                <li><a href="#" className="hover:text-green-600 transition">Festivals</a></li>
                <li><a href="#" className="hover:text-green-600 transition">Théâtre</a></li>
                <li><a href="#" className="hover:text-green-600 transition">Conférences</a></li>
            </ul>
          </div>

          {/* Colonne 3 : Aide */}
          <div>
            <h4 className="font-bold text-white mb-4">Aide & Support</h4>
            <ul className="space-y-2 text-sm text-white">
                <li><a href="#" className="hover:text-green-600 transition">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-green-600 transition">Organiser un événement</a></li>
                <li><a href="#" className="hover:text-green-600 transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-green-600 transition">Contact</a></li>
            </ul>
          </div>

          {/* Colonne 4 : Social */}
          <div>
            <h4 className="font-bold text-white mb-4">Suivez-nous</h4>
            <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                    <a key={i} href="#" className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-50 hover:text-green-600 transition-all">
                        <Icon size={18} />
                    </a>
                ))}
            </div>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <p>© 2025 Eventify Inc. Tous droits réservés.</p>
            <p className="flex items-center gap-1">
                Fait avec <Heart size={12} className="text-red-400 fill-red-400" /> au Maroc
            </p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-slate-600">Confidentialité</a>
                <a href="#" className="hover:text-slate-600">Conditions</a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;