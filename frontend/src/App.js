import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X, Phone, Mail, MapPin, Calendar, Clock, Star, ChevronRight, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import '@/App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    message: ''
  });

  const services = [
    {
      title: 'İmplant Tedavisi',
      description: 'Eksik dişleriniz için kalıcı ve doğal görünümlü çözümler sunuyoruz.',
      icon: '🦷'
    },
    {
      title: 'Ortodonti',
      description: 'Diş teli ve şeffaf plak ile gülüşünüzü düzeltiyoruz.',
      icon: '😁'
    },
    {
      title: 'Diş Beyazlatma',
      description: 'Profesyonel beyazlatma ile dişlerinizi birkaç ton açın.',
      icon: '✨'
    },
    {
      title: 'Kanal Tedavisi',
      description: 'Ağrısız kanal tedavisi ile dişlerinizi kurtarıyoruz.',
      icon: '🔬'
    },
    {
      title: 'Zirkonyum Kaplama',
      description: 'Estetik ve dayanıklı zirkonyum kaplamalar ile mükemmel gülüş.',
      icon: '💎'
    },
    {
      title: 'Çocuk Diş Hekimliği',
      description: 'Çocuklarınızın diş sağlığı için özel yaklaşım ve sevgi dolu hizmet.',
      icon: '👶'
    }
  ];

  const testimonials = [
    {
      name: 'Ayşe Yılmaz',
      rating: 5,
      comment: 'Dr. Ahmet Bey ile tanıştığıma çok memnunum. İmplant tedavim harika geçti, hiç ağrı hissetmedim. Tüm ekip çok ilgili ve profesyonel.',
      date: '2 hafta önce'
    },
    {
      name: 'Mehmet Demir',
      rating: 5,
      comment: 'Yıllardır gittiğim en iyi diş hekimi. Kliniği çok temiz ve modern. Ortodonti tedavim sürecinde sürekli bilgilendirme yapıldı.',
      date: '1 ay önce'
    },
    {
      name: 'Zeynep Kaya',
      rating: 5,
      comment: 'Diş beyazlatma işlemi sonucu harika! Gülüşümden çok memnunum. Herkese tavsiye ediyorum.',
      date: '3 hafta önce'
    },
    {
      name: 'Can Özdemir',
      rating: 5,
      comment: 'Çocuğum diş hekiminden korkuyordu ama Dr. Ahmet Bey sayesinde artık severek gidiyor. Çok teşekkür ederiz!',
      date: '1 hafta önce'
    }
  ];

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!appointmentForm.name || !appointmentForm.phone || !appointmentForm.email || !appointmentForm.date) {
      toast.error('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    try {
      await axios.post(`${API}/appointments`, appointmentForm);
      toast.success('Randevunuz başarıyla oluşturuldu! En kısa sürede size dönüş yapacağız.');
      setAppointmentForm({
        name: '',
        phone: '',
        email: '',
        date: '',
        message: ''
      });
    } catch (error) {
      console.error('Randevu oluşturma hatası:', error);
      toast.error('Randevu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/905551234567?text=Merhaba, randevu almak istiyorum.', '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/20 shadow-lg"
      >
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex items-center justify-between h-20">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold font-heading text-slate-900"
            >
              Dr. Ahmet Yılmaz
            </motion.div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => scrollToSection('home')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
                data-testid="nav-home"
              >
                Ana Sayfa
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
                data-testid="nav-services"
              >
                Hizmetler
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
                data-testid="nav-about"
              >
                Hakkımızda
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
                data-testid="nav-testimonials"
              >
                Yorumlar
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-slate-600 hover:text-primary font-medium transition-colors"
                data-testid="nav-contact"
              >
                İletişim
              </button>
            </div>

            <Button
              onClick={() => scrollToSection('appointment')}
              className="hidden md:flex rounded-full bg-primary text-white px-8 py-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 items-center gap-2"
              data-testid="nav-appointment-btn"
            >
              <Calendar className="w-5 h-5" />
              Randevu Al
            </Button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-900"
              data-testid="mobile-menu-toggle"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-slate-200 py-4"
            data-testid="mobile-menu"
          >
            <div className="container mx-auto px-4 flex flex-col gap-4">
              <button
                onClick={() => scrollToSection('home')}
                className="text-slate-600 hover:text-primary font-medium transition-colors text-left"
                data-testid="mobile-nav-home"
              >
                Ana Sayfa
              </button>
              <button
                onClick={() => scrollToSection('services')}
                className="text-slate-600 hover:text-primary font-medium transition-colors text-left"
                data-testid="mobile-nav-services"
              >
                Hizmetler
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className="text-slate-600 hover:text-primary font-medium transition-colors text-left"
                data-testid="mobile-nav-about"
              >
                Hakkımızda
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-slate-600 hover:text-primary font-medium transition-colors text-left"
                data-testid="mobile-nav-testimonials"
              >
                Yorumlar
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-slate-600 hover:text-primary font-medium transition-colors text-left"
                data-testid="mobile-nav-contact"
              >
                İletişim
              </button>
              <Button
                onClick={() => scrollToSection('appointment')}
                className="rounded-full bg-primary text-white px-8 py-6 font-semibold"
                data-testid="mobile-nav-appointment-btn"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Randevu Al
              </Button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-24 md:pt-40 md:pb-32 bg-gradient-to-br from-slate-50 to-sky-50" data-testid="hero-section">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-6">
                <span className="text-primary font-semibold text-sm tracking-wide uppercase" data-testid="hero-badge">
                  ✨ Gülüş Tasarımı Uzmanı
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 font-heading" data-testid="hero-title">
                Sağlıklı Gülüşler İçin Buradayız
              </h1>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-8" data-testid="hero-description">
                Modern diş hekimliği anlayışı ile hastalarımıza güvenli, konforlu ve estetik çözümler sunuyoruz. 
                15 yıllık deneyimimiz ve hasta memnuniyetine verdiğimiz önemle yanınızdayız.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => scrollToSection('appointment')}
                  className="rounded-full bg-primary text-white px-8 py-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                  data-testid="hero-appointment-btn"
                >
                  <Calendar className="w-5 h-5" />
                  Online Randevu Al
                </Button>
                <Button
                  onClick={openWhatsApp}
                  className="rounded-full bg-white text-slate-900 border border-slate-200 px-8 py-6 font-semibold hover:bg-slate-50 transition-all duration-300 flex items-center justify-center gap-2"
                  data-testid="hero-whatsapp-btn"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp
                </Button>
              </div>
              <div className="mt-12 flex items-center gap-8">
                <div>
                  <div className="text-3xl font-bold text-slate-900">15+</div>
                  <div className="text-sm text-slate-600">Yıl Deneyim</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">5000+</div>
                  <div className="text-sm text-slate-600">Mutlu Hasta</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">4.9</div>
                  <div className="text-sm text-slate-600 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-accent-gold text-accent-gold" />
                    Değerlendirme
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="https://images.pexels.com/photos/6812463/pexels-photo-6812463.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Modern Diş Kliniği"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                data-testid="hero-image"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 md:py-32" data-testid="services-section">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium tracking-wide uppercase text-slate-500 mb-4 block">HİZMETLERİMİZ</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 mb-4" data-testid="services-title">
              Size Nasıl Yardımcı Olabiliriz?
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Modern ekipmanlarımız ve uzman kadromuzla geniş bir hizmet yelpazesi sunuyoruz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-sky-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                data-testid={`service-card-${index}`}
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-3">{service.title}</h3>
                <p className="text-base text-slate-600 leading-relaxed mb-4">{service.description}</p>
                <button
                  className="text-primary hover:text-primary-600 font-medium transition-colors flex items-center gap-2 group-hover:gap-3 transition-all"
                  data-testid={`service-learn-more-${index}`}
                >
                  Detaylı Bilgi
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 md:py-32 bg-slate-50" data-testid="about-section">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img
                src="https://images.pexels.com/photos/14235194/pexels-photo-14235194.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Dr. Ahmet Yılmaz"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
                data-testid="about-image"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-sm font-medium tracking-wide uppercase text-slate-500 mb-4 block">HAKKIMIZDA</span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 mb-6" data-testid="about-title">
                Dr. Ahmet Yılmaz
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6">
                2009 yılında İstanbul Üniversitesi Diş Hekimliği Fakültesi'nden mezun olduktan sonra, 
                estetik diş hekimliği alanında uzmanlaşmak için yurt içi ve yurt dışında çeşitli eğitimler aldım.
              </p>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6">
                15 yıllık kariyerim boyunca 5000'den fazla hastaya hizmet verdim. İmplantoloji ve estetik 
                diş hekimliği alanlarında sertifikalarım bulunmaktadır. Hasta memnuniyetini her şeyin 
                önünde tutarak, en son teknolojileri kullanarak hizmet veriyorum.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">İstanbul Üniversitesi Diş Hekimliği Fakültesi</div>
                    <div className="text-sm text-slate-600">Lisans, 2009</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">İmplantoloji Sertifikası</div>
                    <div className="text-sm text-slate-600">İleri Seviye, 2012</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Estetik Diş Hekimliği Sertifikası</div>
                    <div className="text-sm text-slate-600">Uluslararası, 2015</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 md:py-32" data-testid="testimonials-section">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium tracking-wide uppercase text-slate-500 mb-4 block">HASTA YORUMLARI</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 mb-4" data-testid="testimonials-title">
              Hastalarımız Ne Diyor?
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Bize güvenen hastalarımızın deneyimlerini okuyun.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 p-8 rounded-2xl border border-transparent hover:border-sky-100 transition-colors"
                data-testid={`testimonial-card-${index}`}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent-gold text-accent-gold" data-testid={`star-${index}-${i}`} />
                  ))}
                </div>
                <p className="text-base text-slate-600 leading-relaxed mb-6 italic">
                  "{testimonial.comment}"
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.date}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Appointment Section */}
      <section id="appointment" className="py-24 md:py-32 bg-slate-50" data-testid="appointment-section">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-sm font-medium tracking-wide uppercase text-slate-500 mb-4 block">RANDEVU</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 mb-4" data-testid="appointment-title">
              Online Randevu Alın
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              Formu doldurun, en kısa sürede size dönüş yapalım.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onSubmit={handleAppointmentSubmit}
            className="bg-white p-8 md:p-12 rounded-2xl shadow-lg space-y-6"
            data-testid="appointment-form"
          >
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2" htmlFor="name">
                Ad Soyad *
              </label>
              <Input
                id="name"
                type="text"
                value={appointmentForm.name}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, name: e.target.value })}
                className="rounded-xl border-slate-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none w-full"
                placeholder="Adınız ve soyadınız"
                required
                data-testid="appointment-name-input"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2" htmlFor="phone">
                  Telefon *
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={appointmentForm.phone}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, phone: e.target.value })}
                  className="rounded-xl border-slate-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none w-full"
                  placeholder="0555 123 45 67"
                  required
                  data-testid="appointment-phone-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2" htmlFor="email">
                  E-posta *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={appointmentForm.email}
                  onChange={(e) => setAppointmentForm({ ...appointmentForm, email: e.target.value })}
                  className="rounded-xl border-slate-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none w-full"
                  placeholder="ornek@email.com"
                  required
                  data-testid="appointment-email-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2" htmlFor="date">
                Tercih Ettiğiniz Tarih *
              </label>
              <Input
                id="date"
                type="date"
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                className="rounded-xl border-slate-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none w-full"
                required
                data-testid="appointment-date-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2" htmlFor="message">
                Mesajınız (İsteğe bağlı)
              </label>
              <Textarea
                id="message"
                value={appointmentForm.message}
                onChange={(e) => setAppointmentForm({ ...appointmentForm, message: e.target.value })}
                className="rounded-xl border-slate-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none w-full min-h-[120px]"
                placeholder="Bizimle paylaşmak istediğiniz bir şey var mı?"
                data-testid="appointment-message-textarea"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-full bg-primary text-white px-8 py-6 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              data-testid="appointment-submit-btn"
            >
              <Calendar className="w-5 h-5" />
              Randevu Oluştur
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={openWhatsApp}
                className="text-primary hover:text-primary-600 font-medium transition-colors inline-flex items-center gap-2"
                data-testid="appointment-whatsapp-link"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp ile hızlı randevu
              </button>
            </div>
          </motion.form>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 md:py-32" data-testid="contact-section">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-medium tracking-wide uppercase text-slate-500 mb-4 block">İLETİŞİM</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-900 mb-4" data-testid="contact-title">
              Bize Ulaşın
            </h2>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Sorularınız için bizimle iletişime geçmekten çekinmeyin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Telefon</h3>
                  <p className="text-slate-600">+90 (555) 123 45 67</p>
                  <p className="text-slate-600">+90 (212) 456 78 90</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">E-posta</h3>
                  <p className="text-slate-600">info@drahmetyilmaz.com</p>
                  <p className="text-slate-600">randevu@drahmetyilmaz.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Adres</h3>
                  <p className="text-slate-600">
                    Atatürk Caddesi No: 123<br />
                    Kadıköy / İstanbul
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Çalışma Saatleri</h3>
                  <p className="text-slate-600">Pazartesi - Cuma: 09:00 - 19:00</p>
                  <p className="text-slate-600">Cumartesi: 09:00 - 17:00</p>
                  <p className="text-slate-600">Pazar: Kapalı</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d48158.305462077615!2d29.008504499999996!3d40.9888688!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cac7201c8830a1%3A0x5190f8d9ada1e23f!2zS2FkxLFrw7Z5LCDEsHN0YW5idWw!5e0!3m2!1str!2str!4v1234567890123!5m2!1str!2str"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Klinik Konumu"
                  data-testid="contact-map"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12" data-testid="footer">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold font-heading mb-4">Dr. Ahmet Yılmaz</h3>
              <p className="text-slate-400 leading-relaxed">
                Sağlıklı gülüşler için modern diş hekimliği hizmetleri.
              </p>
              <div className="mt-4">
                <span className="inline-block px-3 py-1 bg-primary/20 text-primary-100 rounded-full text-sm font-medium">
                  ✨ Gülüş Tasarımı Uzmanı
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">
                    Ana Sayfa
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('services')} className="hover:text-white transition-colors">
                    Hizmetler
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('about')} className="hover:text-white transition-colors">
                    Hakkımızda
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('appointment')} className="hover:text-white transition-colors">
                    Randevu
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Sosyal Medya</h4>
              <div className="flex gap-4">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary transition-colors flex items-center justify-center"
                  data-testid="footer-instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-primary transition-colors flex items-center justify-center"
                  data-testid="footer-facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Dr. Ahmet Yılmaz. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        onClick={openWhatsApp}
        className="fixed bottom-8 right-8 w-16 h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-2xl flex items-center justify-center z-50 transition-all duration-300 hover:scale-110"
        data-testid="whatsapp-floating-btn"
      >
        <MessageCircle className="w-8 h-8" />
      </motion.button>
    </div>
  );
};

export default App;