import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, ShieldCheck, Globe, 
  Sparkles, Heart, ArrowRight, Zap 
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import slimane from '../assets/slimane.jpg';
import mohamed from '../assets/mohamed.jpg';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-50 py-20 lg:py-32">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="border-green-600 text-green-600 px-4 py-1 text-sm uppercase tracking-wider bg-green-50">
              Notre Histoire
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Réinventer la façon dont vous vivez les <span className="text-green-600">événements</span>.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed">
              Eventify n'est pas seulement une plateforme de billetterie. C'est le pont entre les créateurs passionnés et les publics en quête d'émotions inoubliables.
            </p>
            <div className="pt-4 flex justify-center gap-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8" onClick={() => navigate('/')}>
                    Explorer les événements
                </Button>
                <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => navigate('/register')}>
                    Rejoindre la communauté
                </Button>
            </div>
          </div>
        </div>
        
        {/* Background decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2 animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2 animate-blob animation-delay-2000"></div>
      </section>

      {/* 2. STATS SECTION */}
      <section className="py-12 border-y bg-white">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                    { label: "Utilisateurs Actifs", value: "50K+", icon: Users },
                    { label: "Événements Créés", value: "1200+", icon: Sparkles },
                    { label: "Pays Couverts", value: "15", icon: Globe },
                    { label: "Tickets Vendus", value: "1M+", icon: Target },
                ].map((stat, idx) => (
                    <div key={idx} className="space-y-2">
                        <div className="flex justify-center text-green-600 mb-2">
                            <stat.icon size={32} strokeWidth={1.5} />
                        </div>
                        <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 3. MISSION & VISION (Split Layout) */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="relative">
                    <div className="absolute -inset-4 bg-green-100 rounded-2xl transform -rotate-2"></div>
                    <img 
                        src="https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=2070&auto=format&fit=crop" 
                        alt="Team brainstorming" 
                        className="relative rounded-2xl shadow-xl w-full object-cover h-[500px]"
                    />
                </div>
                <div className="space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Notre Mission</h2>
                        <p className="text-slate-600 text-lg leading-relaxed">
                            Nous avons créé Eventify avec une conviction simple : organiser ou participer à un événement devrait être fluide, sécurisé et excitant. Trop souvent, la technologie est un obstacle. Nous voulons qu'elle devienne invisible pour laisser place à l'expérience.
                        </p>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-700">
                                <ShieldCheck size={20} />
                            </div>
                            <h3 className="font-semibold text-lg">Confiance & Sécurité</h3>
                            <p className="text-sm text-slate-500">Chaque billet est vérifié, chaque transaction est sécurisée. Fini les arnaques.</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700">
                                <Zap size={20} />
                            </div>
                            <h3 className="font-semibold text-lg">Simplicité Radicale</h3>
                            <p className="text-sm text-slate-500">Une interface intuitive pour les organisateurs comme pour les participants.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* 4. TEAM SECTION */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-slate-900 mb-4">L'équipe derrière la magie</h2>
                <p className="text-slate-600">
                    Des passionnés de musique, de technologie et d'organisation réunis pour construire le futur de l'événementiel.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                    { name: "ABDELHADI Slimane", img : slimane , p:"La passion est le moteur de l'innovation. Chez Eventify, nous vivons pour créer des connexions."},
                    { name: "OUCHGOUT Mohamed" , img : mohamed , p: "Derrière chaque événement réussi se cache une architecture solide. Nous repoussons les limites de la technologie pour garantir une fluidité sans faille."},
                    { name: "IDOUFKIR Kamal" , p:"L'organisation d'événements est un art. Nous sommes les artistes qui sculptent des expériences inoubliables."},
                    { name: "RADFI Abdallah",  p:"Chaque billet vendu est une promesse d'émotion. Nous nous engageons à tenir cette promesse avec intégrité et passion."},
                ].map((member, i) => (
                    <Card key={i} className="border-none shadow-md hover:shadow-xl transition-all duration-300">
                        <CardContent className="pt-6 text-center">
                            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white shadow-lg">
                                <AvatarImage src={member.img} className="object-cover" />
                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                            </Avatar>
                            <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                            <p className="text-green-600 font-medium mb-4">{member.role}</p>
                            <p className="text-sm text-slate-500">
                                {member.p || "Passionné par la technologie et l'innovation, je m'efforce de repousser les limites pour offrir des expériences inoubliables."}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Questions Fréquentes</h2>
            
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg">Eventify est-il gratuit pour les organisateurs ?</AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                        L'inscription et la création d'événements gratuits sont 100% gratuites. Pour les événements payants, nous prenons une petite commission sur chaque billet vendu.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg">Comment sont sécurisés les paiements ?</AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                        Nous utilisons des standards bancaires de pointe (Stripe, CMI) pour garantir que chaque transaction est chiffrée et sécurisée.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg">Puis-je annuler ma réservation ?</AccordionTrigger>
                    <AccordionContent className="text-slate-600">
                        Cela dépend de la politique de l'organisateur. Cette information est clairement affichée sur la page de chaque événement avant l'achat.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </section>

      {/* 6. CTA FINAL */}
      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Prêt à lancer votre prochain événement ?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
                Rejoignez des milliers d'organisateurs qui font confiance à Eventify pour gérer leur billetterie.
            </p>
            <Button size="xl" className="bg-green-600 hover:bg-green-500 text-white rounded-full px-10 py-6 text-lg font-bold shadow-2xl shadow-green-900/20" onClick={() => navigate('/register')}>
                Commencer Gratuitement <ArrowRight className="ml-2" />
            </Button>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;