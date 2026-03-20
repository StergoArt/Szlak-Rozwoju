import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const SzlakRozwoju = () => {
  const [activeService, setActiveService] = useState(null);
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    participantAge: '',
    serviceType: '',
    message: ''
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Formularz wysłany! (W wersji produkcyjnej zostanie podłączony backend/n8n)');
    console.log('Form data:', formData);
  };

  const services = [
    {
      id: 1,
      title: "Socjoterapia Indywidualna",
      icon: "👤",
      color: "#FFCC00",
      description: "Indywidualna praca terapeutyczna dostosowana do potrzeb każdego uczestnika — dziecka, nastolatka lub osoby dorosłej",
      details: [
        "Format: stacjonarnie w Żywcu lub online",
        "Dla dzieci (6-12 lat), młodzieży (13-18 lat) i dorosłych",
        "Sesje: 60 minut, raz w tygodniu",
        "Praca nad nieśmiałością, lękami, trudnościami w relacjach"
      ],
      price: "od 140 zł / sesja"
    },
    {
      id: 2,
      title: "Socjoterapia Grupowa",
      icon: "👥",
      color: "#4ECDC4",
      description: "Grupowe zajęcia rozwijające umiejętności społeczne i emocjonalne",
      details: [
        "Format: stacjonarnie w Żywcu lub online (2-6 osób)",
        "Grupy wiekowe: dzieci (6-12 lat), młodzież (13-18 lat), dorośli (18+)",
        "Sesje: 75 minut, raz w tygodniu",
        "Praca nad komunikacją, współpracą, budowaniem relacji"
      ],
      price: "90 zł / osoba"
    },
    {
      id: 3,
      title: "Trening Umiejętności Społecznych (TUS)",
      icon: "🎯",
      color: "#FF6B6B",
      description: "Praktyczne ćwiczenia rozwijające kompetencje społeczne",
      details: [
        "Format: indywidualnie lub grupowo, stacjonarnie/online",
        "Dla dzieci, młodzieży i dorosłych z trudnościami w relacjach — w tym dzieci ze spektrum autyzmu (ASD) i z zespołem Aspergera",
        "Metody: gry, scenki, dyskusje, ćwiczenia praktyczne",
        "Asertywność, rozwiązywanie konfliktów, wyrażanie potrzeb",
        "Indywidualnie: 50 minut / 120 zł",
        "Grupowo (2-6 osób): 60 minut / 100 zł"
      ],
      price: "od 105 zł"
    },
    {
      id: 4,
      title: "Zajęcia Ruchowe i Obozy",
      icon: "⛷️",
      color: "#9B59B6",
      description: "Aktywność fizyczna na świeżym powietrzu łączona z terapią — dla wszystkich grup wiekowych",
      details: [
        "Sporty zimowe: narty, snowboard, saneczki",
        "Sporty wodne: kajaki, pływanie, SUP",
        "Inne: wspinaczka, rower górski, nordic walking",
        "Wyjazdy weekendowe i obozy wakacyjne/zimowe"
      ],
      price: "do uzgodnienia"
    }
  ];

  const faqs = [
    {
      question: "Ile trwa terapia?",
      answer: "Zazwyczaj 3-6 miesięcy regularnych sesji, w zależności od indywidualnych potrzeb uczestnika. Proces terapeutyczny jest elastyczny i zawsze dostosowywany do tempa rozwoju — niezależnie od tego, czy pracujemy z dzieckiem, nastolatkiem czy osobą dorosłą."
    },
    {
      question: "Czy bliscy mogą uczestniczyć w procesie terapii?",
      answer: "W przypadku dzieci i młodzieży regularnie spotykamy się z rodzicami, aby omawiać postępy i wspólnie wspierać rozwój. Dorośli uczestnicy mogą zaprosić bliską osobę na wybrane spotkania, jeśli uznają to za pomocne."
    },
    {
      question: "Czy prowadzicie zajęcia online?",
      answer: "Tak, oferujemy zarówno terapię indywidualną, jak i grupową w formie online. Wykorzystujemy profesjonalne platformy zapewniające bezpieczeństwo i komfort prowadzenia sesji."
    },
    {
      question: "Ile kosztuje sesja?",
      answer: "Socjoterapia indywidualna: od 140 zł/sesja (160 zł bez pakietu). TUS indywidualny: od 105 zł/sesja (120 zł bez pakietu). Socjoterapia grupowa: 90 zł/osoba (75 min). TUS grupowy: 100 zł (60 min). Oferujemy pakiety z rabatem 12,5%: socjoterapia — 5 sesji za 700 zł, 10 sesji za 1400 zł; TUS — 5 sesji za 525 zł, 10 sesji za 1050 zł. Pierwsze spotkanie diagnostyczne jest bezpłatne."
    },
    {
      question: "Jak zapisać się na obóz lub wyjazd?",
      answer: "Rezerwacja odbywa się przez formularz kontaktowy na stronie, telefonicznie lub mailowo. Miejsca są ograniczone, więc zalecamy wczesną rezerwację. Przed wyjazdem organizujemy spotkanie informacyjne dla uczestników (a w przypadku dzieci — również dla rodziców)."
    },
    {
      question: "Jakie są efekty terapii?",
      answer: "Uczestnicy zyskują większą pewność siebie, łatwiej nawiązują relacje, lepiej rozpoznają i kontrolują emocje oraz potrafią asertywnie komunikować swoje potrzeby. Efekty są widoczne w szkole, w pracy i w relacjach z bliskimi."
    }
  ];

  const processSteps = [
    { number: 1, title: "Bezpłatna konsultacja", description: "20-minutowa rozmowa, podczas której poznaję Twoje potrzeby lub potrzeby Twojego dziecka" },
    { number: 2, title: "Diagnoza i plan", description: "Ustalamy wspólnie cele terapii i format pracy (indywidualny/grupowy, online/stacjonarny)" },
    { number: 3, title: "Regularne sesje", description: "Budujemy umiejętności krok po kroku w bezpiecznej, wspierającej atmosferze" },
    { number: 4, title: "Monitorowanie postępów", description: "Regularna ewaluacja postępów — spotkania z uczestnikiem, a w przypadku dzieci również z rodzicami" },
    { number: 5, title: "Samodzielność", description: "Utrwalanie umiejętności w życiu codziennym i przygotowanie do zakończenia terapii" }
  ];

  return (
    <div style={{ 
      fontFamily: "'Poppins', sans-serif",
      color: '#2D3748',
      backgroundColor: '#FFFFFF',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&family=Source+Sans+Pro:wght@300;400;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden;
        }

        .warm-gradient {
          background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 50%, #FFF4E0 100%);
        }

        .path-decoration {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .path-curve {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          opacity: 0.15;
          filter: blur(40px);
        }

        .service-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, transparent 0%, rgba(255,204,0,0.1) 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .service-card:hover::before {
          opacity: 1;
        }

        .service-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }

        .cta-button {
          background: linear-gradient(135deg, #FFCC00 0%, #FFB800 100%);
          color: #1A202C;
          padding: 16px 40px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 18px;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(255,204,0,0.3);
          position: relative;
          overflow: hidden;
        }

        .cta-button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        .cta-button:hover::before {
          width: 300px;
          height: 300px;
        }

        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 15px 35px rgba(255,204,0,0.4);
        }

        .faq-item {
          border-left: 4px solid transparent;
          transition: all 0.3s ease;
        }

        .faq-item:hover {
          border-left-color: #FFCC00;
          background: rgba(255,204,0,0.05);
        }

        .form-input {
          width: 100%;
          padding: 14px 20px;
          border: 2px solid #E2E8F0;
          border-radius: 12px;
          font-size: 16px;
          font-family: 'Source Sans Pro', sans-serif;
          transition: all 0.3s ease;
          background: #FFFFFF;
        }

        .form-input:focus {
          outline: none;
          border-color: #FFCC00;
          box-shadow: 0 0 0 3px rgba(255,204,0,0.1);
        }

        .section-title {
          font-size: 48px;
          font-weight: 800;
          color: #1A202C;
          margin-bottom: 16px;
          position: relative;
          display: inline-block;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 0;
          width: 60px;
          height: 6px;
          background: linear-gradient(90deg, #FFCC00, #FF6B6B);
          border-radius: 3px;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .floating {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        padding: '16px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <img 
            src="/mnt/user-data/uploads/logo.png" 
            alt="Szlak Rozwoju" 
            style={{ height: '60px' }}
          />
          <div style={{ display: 'flex', gap: '32px', fontSize: '16px', fontWeight: 500 }}>
            <a href="#about" style={{ color: '#2D3748', textDecoration: 'none', transition: 'color 0.3s' }}>O nas</a>
            <a href="#services" style={{ color: '#2D3748', textDecoration: 'none', transition: 'color 0.3s' }}>Usługi</a>
            <a href="#pricing" style={{ color: '#2D3748', textDecoration: 'none', transition: 'color 0.3s' }}>Cennik</a>
            <a href="#faq" style={{ color: '#2D3748', textDecoration: 'none', transition: 'color 0.3s' }}>FAQ</a>
            <a href="#contact" style={{ color: '#2D3748', textDecoration: 'none', transition: 'color 0.3s' }}>Kontakt</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="warm-gradient" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        paddingTop: '100px'
      }}>
        <div className="path-decoration">
          <div className="path-curve" style={{ background: '#FFCC00', top: '10%', left: '5%' }}></div>
          <div className="path-curve" style={{ background: '#4ECDC4', bottom: '15%', right: '10%' }}></div>
          <div className="path-curve" style={{ background: '#FF6B6B', top: '40%', right: '20%' }}></div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '80px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '24px',
              color: '#1A202C'
            }}>
              Szlak do <span style={{ color: '#FFCC00' }}>pewności siebie</span> i lepszych relacji
            </h1>
            <p style={{
              fontSize: '22px',
              lineHeight: 1.7,
              color: '#4A5568',
              marginBottom: '16px',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Trudności z nawiązywaniem relacji? Nieśmiałość w grupie? Problemy z kontrolowaniem emocji? Niezależnie od wieku — możesz to zmienić.
            </p>
            <p style={{
              fontSize: '20px',
              lineHeight: 1.7,
              color: '#2D3748',
              marginBottom: '40px',
              fontFamily: "'Source Sans Pro', sans-serif",
              fontWeight: 600
            }}>
              Jesteś w dobrym miejscu. Pomagamy dzieciom, młodzieży i dorosłym budować pewność siebie i rozwijać umiejętności społeczne.
            </p>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button className="cta-button" onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}>
                Umów bezpłatną konsultację
              </button>
              <button style={{
                background: 'transparent',
                color: '#2D3748',
                padding: '16px 40px',
                borderRadius: '50px',
                fontWeight: 600,
                fontSize: '18px',
                border: '2px solid #E2E8F0',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }} onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}>
                Zobacz usługi
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="floating"
            style={{
              background: 'linear-gradient(135deg, #FFCC00 0%, #FFB800 100%)',
              borderRadius: '30px',
              padding: '60px',
              boxShadow: '0 30px 60px rgba(255,204,0,0.3)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '72px', marginBottom: '24px' }}>🌱</div>
            <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
              Wieloletnie doświadczenie
            </h3>
            <p style={{ fontSize: '18px', color: '#2D3748', lineHeight: 1.6 }}>
              Socjoterapia dla dzieci, młodzieży i dorosłych. Umiejętności społeczne, emocje, relacje.
            </p>
            <div style={{
              display: 'inline-block',
              background: 'rgba(0,0,0,0.12)',
              color: '#1A202C',
              fontSize: '15px',
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: '20px',
              marginTop: '20px'
            }}>
              🎯 TUS — Trening Umiejętności Społecznych
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{
        padding: '120px 24px',
        background: '#FFFFFF'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1.3fr',
          gap: '80px',
          alignItems: 'center'
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, #4ECDC4 0%, #3BA99C 100%)',
              borderRadius: '30px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(78,205,196,0.3)'
            }}
          >
            <div style={{
              width: '200px',
              height: '200px',
              background: '#FFFFFF',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '80px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              👩‍⚕️
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
              Dorota Kluz
            </h3>
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
              Socjoterapeutka z wieloletnim doświadczeniem
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="section-title">O gabinecie</h2>
            <p style={{
              fontSize: '20px',
              lineHeight: 1.8,
              color: '#4A5568',
              marginBottom: '24px',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Jestem <strong>Dorota Kluz</strong> – socjoterapeutka z wieloletnim doświadczeniem w pracy z dziećmi, młodzieżą i osobami dorosłymi.
              Moja praca koncentruje się na kształtowaniu umiejętności społecznych, rozpoznawaniu i kontrolowaniu emocji oraz nawiązywaniu satysfakcjonujących relacji z innymi.
            </p>
            <p style={{
              fontSize: '20px',
              lineHeight: 1.8,
              color: '#4A5568',
              marginBottom: '24px',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              W Szlaku Rozwoju łączymy profesjonalną terapię z pasją do aktywności na świeżym powietrzu. Współpracuję z <strong>wykwalifikowanymi trenerami</strong> sportów zimowych i wodnych, dzięki czemu oferujemy nie tylko zajęcia gabinetowe, ale też wyjazdy integracyjne i obozy rozwojowe.
            </p>
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,204,0,0.1), rgba(255,107,107,0.1))',
              padding: '30px',
              borderRadius: '20px',
              borderLeft: '6px solid #FFCC00'
            }}>
              <h4 style={{ fontSize: '24px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
                Nasza misja
              </h4>
              <p style={{ fontSize: '18px', lineHeight: 1.7, color: '#2D3748', fontFamily: "'Source Sans Pro', sans-serif" }}>
                Każdy człowiek — niezależnie od wieku — zasługuje na radość z bycia sobą, pewność siebie i prawdziwe relacje. Pomagamy dzieciom, młodzieży i dorosłym rozwijać umiejętności społeczne, rozpoznawać emocje i budować odwagę w kontaktach z innymi.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="warm-gradient" style={{
        padding: '120px 24px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="section-title" style={{ display: 'block' }}>Nasze usługi</h2>
            <p style={{
              fontSize: '20px',
              color: '#4A5568',
              maxWidth: '700px',
              margin: '24px auto 0',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Oferujemy kompleksowe wsparcie w rozwoju emocjonalnym i społecznym. Wybierz formę pracy dopasowaną do Twoich potrzeb.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '40px'
          }}>
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="service-card"
                onClick={() => setActiveService(activeService === service.id ? null : service.id)}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '40px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  border: `3px solid ${activeService === service.id ? service.color : 'transparent'}`
                }}
              >
                <div style={{
                  width: '80px',
                  height: '80px',
                  background: `linear-gradient(135deg, ${service.color}, ${service.color}dd)`,
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  marginBottom: '24px',
                  boxShadow: `0 10px 25px ${service.color}40`
                }}>
                  {service.icon}
                </div>
                <h3 style={{ fontSize: '28px', fontWeight: 700, color: '#1A202C', marginBottom: '12px' }}>
                  {service.title}
                </h3>
                <p style={{ fontSize: '18px', color: '#4A5568', lineHeight: 1.6, marginBottom: '20px', fontFamily: "'Source Sans Pro', sans-serif" }}>
                  {service.description}
                </p>
                
                {activeService === service.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{
                      background: 'rgba(0,0,0,0.02)',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '20px'
                    }}>
                      {service.details.map((detail, i) => (
                        <div key={i} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                          fontSize: '16px',
                          color: '#2D3748'
                        }}>
                          <span style={{ color: service.color, marginRight: '12px', fontSize: '20px' }}>•</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '20px',
                      background: `linear-gradient(135deg, ${service.color}15, ${service.color}05)`,
                      borderRadius: '12px'
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', color: '#718096', marginBottom: '4px' }}>Cena</div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A202C' }}>{service.price}</div>
                      </div>
                      <button 
                        className="cta-button" 
                        style={{ padding: '12px 28px', fontSize: '16px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        Umów się
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeService !== service.id && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <span style={{ color: service.color, fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      Kliknij aby zobaczyć więcej →
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section style={{ padding: '120px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="section-title" style={{ display: 'block' }}>Proces współpracy</h2>
            <p style={{
              fontSize: '20px',
              color: '#4A5568',
              maxWidth: '700px',
              margin: '24px auto 0',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Od pierwszego kontaktu do samodzielności – poznaj pięć kroków naszej wspólnej drogi
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '40px',
                  marginBottom: '60px',
                  flexDirection: index % 2 === 0 ? 'row' : 'row-reverse'
                }}
              >
                <div style={{
                  width: '120px',
                  height: '120px',
                  background: `linear-gradient(135deg, ${['#FFCC00', '#4ECDC4', '#FF6B6B', '#9B59B6', '#FFCC00'][index]}, ${['#FFB800', '#3BA99C', '#E74C3C', '#8E44AD', '#FFB800'][index]})`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                  flexShrink: 0
                }}>
                  {step.number}
                </div>
                <div style={{
                  flex: 1,
                  background: '#FFFFFF',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  border: '2px solid #F7FAFC'
                }}>
                  <h4 style={{ fontSize: '24px', fontWeight: 700, color: '#1A202C', marginBottom: '12px' }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: '18px', color: '#4A5568', lineHeight: 1.6, fontFamily: "'Source Sans Pro', sans-serif" }}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="warm-gradient" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="section-title" style={{ display: 'block' }}>Cennik</h2>
            <p style={{
              fontSize: '20px',
              color: '#4A5568',
              maxWidth: '700px',
              margin: '24px auto 0',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Transparentne ceny i pakiety z rabatem. Pierwsze spotkanie diagnostyczne jest bezpłatne.
            </p>
          </div>

          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #FFCC00, #FFB800)' }}>
                  <th style={{ padding: '24px', textAlign: 'left', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>Usługa</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>Czas trwania</th>
                  <th style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>Cena</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>Konsultacja diagnostyczna</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>20 minut</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#10B981' }}>BEZPŁATNIE</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>Socjoterapia indywidualna</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>60 minut</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>160 zł</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>Socjoterapia grupowa (2-6 osób)</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>75 minut</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>90 zł / osoba</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>TUS indywidualny</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>50 minut</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>120 zł</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>TUS grupowy (2-6 osób)</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>60 minut</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>100 zł</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>Obozy i wyjazdy rozwojowe</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>Weekend / Tydzień</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>Do uzgodnienia</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>Wydanie zaświadczenia</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>—</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>50 zł</td>
                </tr>
                <tr>
                  <td style={{ padding: '24px', fontSize: '16px', color: '#2D3748' }}>Wydanie opinii</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '16px', color: '#2D3748' }}>—</td>
                  <td style={{ padding: '24px', textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#1A202C' }}>120 zł</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '30px',
            marginTop: '60px'
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(135deg, #FFCC00 0%, #FFB800 100%)',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(255,204,0,0.3)'
              }}
            >
              <h4 style={{ fontSize: '24px', fontWeight: 700, color: '#1A202C', marginBottom: '16px' }}>
                Pakiet 5 sesji
              </h4>
              <p style={{ fontSize: '18px', color: '#2D3748', marginBottom: '12px' }}>
                Kup 5 sesji, zapłać za 4
              </p>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#1A202C' }}>
                700 zł <span style={{ fontSize: '18px', textDecoration: 'line-through', opacity: 0.6 }}>800 zł</span>
              </div>
              <div style={{ fontSize: '14px', color: '#2D3748', marginTop: '8px', fontWeight: 600 }}>
                Oszczędzasz 100 zł (12,5%)
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(135deg, #4ECDC4 0%, #3BA99C 100%)',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(78,205,196,0.3)'
              }}
            >
              <h4 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
                Pakiet 10 sesji
              </h4>
              <p style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '12px' }}>
                Kup 10 sesji, zapłać za 8
              </p>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF' }}>
                1400 zł <span style={{ fontSize: '18px', textDecoration: 'line-through', opacity: 0.7 }}>1600 zł</span>
              </div>
              <div style={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px', fontWeight: 600 }}>
                Oszczędzasz 200 zł (12,5%)
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(135deg, #FF6B6B 0%, #E74C3C 100%)',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(255,107,107,0.3)'
              }}
            >
              <h4 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
                Pakiet 5 sesji TUS
              </h4>
              <p style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '12px' }}>
                5 sesji TUS indywidualnego z rabatem
              </p>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF' }}>
                525 zł <span style={{ fontSize: '18px', textDecoration: 'line-through', opacity: 0.7 }}>600 zł</span>
              </div>
              <div style={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px', fontWeight: 600 }}>
                Oszczędzasz 75 zł (12,5%)
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              style={{
                background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
                padding: '40px',
                borderRadius: '20px',
                boxShadow: '0 15px 35px rgba(231,76,60,0.3)'
              }}
            >
              <h4 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', marginBottom: '16px' }}>
                Pakiet 10 sesji TUS
              </h4>
              <p style={{ fontSize: '18px', color: '#FFFFFF', marginBottom: '12px' }}>
                10 sesji TUS indywidualnego z rabatem
              </p>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFFFFF' }}>
                1050 zł <span style={{ fontSize: '18px', textDecoration: 'line-through', opacity: 0.7 }}>1200 zł</span>
              </div>
              <div style={{ fontSize: '14px', color: '#FFFFFF', marginTop: '8px', fontWeight: 600 }}>
                Oszczędzasz 150 zł (12,5%)</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '120px 24px', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="section-title" style={{ display: 'block' }}>Najczęściej zadawane pytania</h2>
            <p style={{
              fontSize: '20px',
              color: '#4A5568',
              maxWidth: '700px',
              margin: '24px auto 0',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Odpowiadamy na pytania, które najczęściej słyszymy od naszych klientów
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="faq-item"
                style={{
                  background: '#FFFFFF',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 5px 20px rgba(0,0,0,0.06)',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
              >
                <div style={{
                  padding: '24px 30px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h4 style={{ fontSize: '20px', fontWeight: 600, color: '#1A202C' }}>
                    {faq.question}
                  </h4>
                  <div style={{
                    fontSize: '24px',
                    color: '#FFCC00',
                    transition: 'transform 0.3s ease',
                    transform: activeFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </div>
                </div>
                {activeFAQ === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    style={{
                      padding: '0 30px 24px',
                      fontSize: '18px',
                      color: '#4A5568',
                      lineHeight: 1.7,
                      fontFamily: "'Source Sans Pro', sans-serif"
                    }}
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="warm-gradient" style={{ padding: '120px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h2 className="section-title" style={{ display: 'block' }}>Co zyskujesz dzięki socjoterapii?</h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px'
          }}>
            {[
              { icon: '💪', title: 'Pewność siebie', description: 'Wiara we własne możliwości i odwaga w podejmowaniu nowych wyzwań' },
              { icon: '👫', title: 'Łatwiejsze nawiązywanie relacji', description: 'Umiejętność inicjowania kontaktu i budowania prawdziwych, satysfakcjonujących więzi' },
              { icon: '😊', title: 'Rozpoznawanie i kontrolowanie emocji', description: 'Umiejętność nazywania uczuć i konstruktywnego ich wyrażania' },
              { icon: '🗣️', title: 'Asertywna komunikacja', description: 'Jasne wyrażanie swoich potrzeb i umiejętność stawiania zdrowych granic' },
              { icon: '🎯', title: 'Wzrost motywacji', description: 'Aktywne podejmowanie działań i wytrwałość w obliczu trudności' },
              { icon: '🎉', title: 'Radość z bycia wśród ludzi', description: 'Komfort w sytuacjach społecznych i chęć uczestniczenia w życiu grupy' }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{
                  background: '#FFFFFF',
                  padding: '40px 30px',
                  borderRadius: '20px',
                  textAlign: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '56px', marginBottom: '20px' }}>{benefit.icon}</div>
                <h4 style={{ fontSize: '22px', fontWeight: 700, color: '#1A202C', marginBottom: '12px' }}>
                  {benefit.title}
                </h4>
                <p style={{ fontSize: '16px', color: '#4A5568', lineHeight: 1.6, fontFamily: "'Source Sans Pro', sans-serif" }}>
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" style={{
        padding: '120px 24px',
        background: '#FFFFFF'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 className="section-title" style={{ display: 'block' }}>Umów bezpłatną konsultację</h2>
            <p style={{
              fontSize: '20px',
              color: '#4A5568',
              maxWidth: '600px',
              margin: '24px auto 0',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Wypełnij formularz, a odezwiemy się w ciągu 24 godzin. Pierwsze spotkanie diagnostyczne jest bezpłatne.
            </p>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            onSubmit={handleSubmit}
            style={{
              background: 'linear-gradient(135deg, rgba(255,204,0,0.05), rgba(78,205,196,0.05))',
              padding: '50px',
              borderRadius: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
              border: '2px solid #F7FAFC'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#2D3748' }}>
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Jan Kowalski"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#2D3748' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="jan.kowalski@example.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#2D3748' }}>
                  Telefon *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="+48 123 456 789"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#2D3748' }}>
                  Wiek uczestnika
                </label>
                <input
                  type="text"
                  name="participantAge"
                  value={formData.participantAge}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="np. 8 lat, 15 lat, 35 lat"
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#2D3748' }}>
                Rodzaj usługi *
              </label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
                className="form-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Wybierz usługę...</option>
                <option value="indywidualna">Socjoterapia indywidualna</option>
                <option value="grupowa">Socjoterapia grupowa</option>
                <option value="tus">Trening Umiejętności Społecznych (TUS)</option>
                <option value="zajecia-ruchowe">Zajęcia ruchowe / Obozy</option>
                <option value="nie-wiem">Nie jestem pewien/pewna</option>
              </select>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#2D3748' }}>
                Wiadomość
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="form-input"
                rows="5"
                placeholder="Opisz swoją sytuację lub zadaj pytanie..."
                style={{ resize: 'vertical', fontFamily: "'Source Sans Pro', sans-serif" }}
              />
            </div>

            <button
              type="submit"
              className="cta-button"
              style={{ width: '100%', fontSize: '18px', padding: '18px' }}
            >
              Wyślij formularz
            </button>

            <p style={{
              fontSize: '14px',
              color: '#718096',
              textAlign: 'center',
              marginTop: '20px',
              fontFamily: "'Source Sans Pro', sans-serif"
            }}>
              Odpowiemy w ciągu 24 godzin. Twoje dane są bezpieczne i nie będą udostępniane osobom trzecim.
            </p>
          </motion.form>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="warm-gradient" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px'
          }}>
            <div style={{
              background: '#FFFFFF',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A202C', marginBottom: '8px' }}>Adres</h4>
              <p style={{ fontSize: '16px', color: '#4A5568', fontFamily: "'Source Sans Pro', sans-serif" }}>
                Żywiec<br />
                Województwo śląskie
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏰</div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A202C', marginBottom: '8px' }}>Godziny pracy</h4>
              <p style={{ fontSize: '16px', color: '#4A5568', fontFamily: "'Source Sans Pro', sans-serif" }}>
                Pn-Pt: 14:00 - 20:00<br />
                Sobota: 9:00 - 15:00
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              padding: '40px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💻</div>
              <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1A202C', marginBottom: '8px' }}>Format zajęć</h4>
              <p style={{ fontSize: '16px', color: '#4A5568', fontFamily: "'Source Sans Pro', sans-serif" }}>
                Online i stacjonarnie<br />
                Indywidualnie i grupowo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: '#1A202C',
        color: '#FFFFFF',
        padding: '60px 24px 30px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <img 
            src="/mnt/user-data/uploads/logo.png" 
            alt="Szlak Rozwoju" 
            style={{ height: '80px', marginBottom: '24px', filter: 'brightness(0) invert(1)' }}
          />
          <h3 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '16px' }}>
            Szlak Rozwoju
          </h3>
          <p style={{
            fontSize: '18px',
            color: '#A0AEC0',
            maxWidth: '600px',
            margin: '0 auto 40px',
            fontFamily: "'Source Sans Pro', sans-serif"
          }}>
            Gabinet Socjoterapii i Rozwoju Osobistego<br />
            Żywiec, województwo śląskie
          </p>

          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '30px',
            marginTop: '40px',
            fontSize: '14px',
            color: '#718096'
          }}>
            <p>© 2025 Szlak Rozwoju. Wszystkie prawa zastrzeżone.</p>
            <p style={{ marginTop: '8px' }}>Dorota Kluz - Wieloletnie doświadczenie w socjoterapii dzieci, młodzieży i dorosłych</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SzlakRozwoju;