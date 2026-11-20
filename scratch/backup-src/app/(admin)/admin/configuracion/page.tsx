'use client';

import React, { useEffect, useState } from 'react';
import {
  Camera,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCatalog } from '@/context/CatalogContext';
import {
  updateBrandSettings,
  updateWhatsAppSettings,
} from '@/lib/firebase/settings.service';
import { uploadOptimizedImage } from '@/lib/firebase/storage.service';
import {
  buildAppointmentMessage,
  buildProductAvailabilityMessage,
  buildProductWhatsAppUrl,
  normalizeWhatsAppPhone,
} from '@/lib/utils/whatsapp';
import { DEFAULT_GLOBAL_SETTINGS } from '@/lib/firebase/seed-data';
import {
  ANNOUNCEMENT_MAX_LENGTH,
  ANNOUNCEMENT_MAX_MESSAGES,
} from '@/lib/announcements';
import type { HeroSlide } from '@/types/database.types';

export default function AdminConfigurationPage() {
  const { settings, products, refreshCatalog } = useCatalog();

  const [activeTab, setActiveTab] = useState<'carousel' | 'whatsapp' | 'brand'>(
    'carousel'
  );
  const [brandForm, setBrandForm] = useState(settings.brand);
  const [waForm, setWaForm] = useState(settings.whatsapp);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSlideIdx, setUploadingSlideIdx] = useState<number | null>(
    null
  );

  useEffect(() => {
    const initialAnnouncements =
      settings.brand.announcementMessages &&
      settings.brand.announcementMessages.length > 0
        ? settings.brand.announcementMessages.slice(0, 5)
        : settings.brand.announcementBar
          ? [settings.brand.announcementBar]
          : DEFAULT_GLOBAL_SETTINGS.brand.announcementMessages || [];

    setBrandForm({
      ...settings.brand,
      announcementMessages: initialAnnouncements,
      heroSlides:
        settings.brand.heroSlides && settings.brand.heroSlides.length > 0
          ? settings.brand.heroSlides
          : DEFAULT_GLOBAL_SETTINGS.brand.heroSlides || [],
    });
    setWaForm(settings.whatsapp);
  }, [settings]);

  const slides: HeroSlide[] =
    brandForm.heroSlides && brandForm.heroSlides.length > 0
      ? brandForm.heroSlides
      : DEFAULT_GLOBAL_SETTINGS.brand.heroSlides || [];

  const announcementMessages: string[] =
    brandForm.announcementMessages && brandForm.announcementMessages.length > 0
      ? brandForm.announcementMessages.slice(0, 5)
      : brandForm.announcementBar
        ? [brandForm.announcementBar]
        : [''];

  const syncAnnouncementMessages = (updated: string[]) => {
    const limited = updated
      .map((message) =>
        Array.from(message.trim())
          .slice(0, ANNOUNCEMENT_MAX_LENGTH)
          .join('')
      )
      .slice(0, ANNOUNCEMENT_MAX_MESSAGES);
    setBrandForm((prev) => ({
      ...prev,
      announcementMessages: limited,
      announcementBar: limited[0] || '',
    }));
  };

  const handleAnnouncementChange = (idx: number, value: string) => {
    syncAnnouncementMessages(
      announcementMessages.map((message, i) => (i === idx ? value : message))
    );
  };

  const handleAddAnnouncement = () => {
    if (announcementMessages.length >= 5) return;
    syncAnnouncementMessages([...announcementMessages, '']);
  };

  const handleRemoveAnnouncement = (idx: number) => {
    const updated = announcementMessages.filter((_, i) => i !== idx);
    syncAnnouncementMessages(updated.length > 0 ? updated : ['']);
  };

  const handleSlideChange = (
    idx: number,
    field: keyof HeroSlide,
    value: string
  ) => {
    const updated = slides.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    );
    setBrandForm((prev) => ({ ...prev, heroSlides: updated }));
  };

  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      badge: 'SKULL • UN NUEVO DESPERTAR',
      title: 'Nuevo mensaje de presentación',
      subtitle:
        'Describe aquí la esencia de tu estudio, materiales certificados o servicios de perforación.',
      imageUrl: '',
      ctaLabel: 'Ver Catálogo',
      ctaHref: '/catalogo',
    };
    setBrandForm((prev) => ({
      ...prev,
      heroSlides: [...slides, newSlide],
    }));
  };

  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 1) {
      toast.error('El carrusel debe tener al menos una diapositiva');
      return;
    }
    const updated = slides.filter((_, i) => i !== idx);
    setBrandForm((prev) => ({ ...prev, heroSlides: updated }));
  };

  const handleSlideImageUpload = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlideIdx(idx);
    try {
      const res = await uploadOptimizedImage(
        file,
        'brand',
        `Carrusel SKULL ${idx + 1}`
      );
      handleSlideChange(idx, 'imageUrl', res.url);
      toast.success('Imagen de diapositiva cargada');
    } catch {
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingSlideIdx(null);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const res = await uploadOptimizedImage(file, 'brand', 'Logo SKULL');
      setBrandForm((prev) => ({ ...prev, logoUrl: res.url }));
      toast.success('Nuevo emblema cargado');
    } catch {
      toast.error('Error al subir el emblema');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBrandSettings(brandForm);
      await refreshCatalog();
      toast.success('Cambios guardados en el catálogo');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeWhatsAppPhone(waForm.phoneNumber);
    if (!normalized) {
      toast.error(
        'Ingresa un número internacional válido con código de país (ej: 573001234567).'
      );
      return;
    }
    setSaving(true);
    try {
      await updateWhatsAppSettings({
        ...waForm,
        phoneNumber: normalized,
      });
      await refreshCatalog();
      toast.success('Configuración de WhatsApp guardada');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const normalizedPreviewPhone = normalizeWhatsAppPhone(waForm.phoneNumber);
  const sampleProduct = products[0] || {
    name: 'Clicker Imperial Amatista & Púas',
    price: 85000,
    currency: 'COP',
    slug: 'clicker-imperial-amatista-puas',
  };
  const sampleWhatsAppUrl = buildProductWhatsAppUrl(sampleProduct, waForm, {
    size: '8mm',
  });
  const sampleAvailabilityMsg = buildProductAvailabilityMessage(sampleProduct, {
    size: '8mm',
  });
  const sampleAppointmentMsg = buildAppointmentMessage(sampleProduct.name);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#261C31] pb-4">
        <span className="text-[11px] uppercase tracking-[0.22em] text-[#C8A97E]">
          Parámetros Globales
        </span>
        <h1 className="font-display text-2xl font-medium text-white">
          Configuración de Carrusel, Marca & WhatsApp
        </h1>
      </div>

      {/* Selector de Pestañas con Texto Blanco */}
      <div className="flex flex-wrap p-1 rounded-md bg-[#0E0A14] border border-[#261C31] gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('carousel')}
          className={`px-4 py-2 rounded-sm text-xs uppercase tracking-[0.16em] font-medium editorial-transition ${
            activeTab === 'carousel'
              ? 'btn-skull-primary font-semibold'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <span className="text-white">Carrusel de Entrada</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 rounded-sm text-xs uppercase tracking-[0.16em] font-medium editorial-transition ${
            activeTab === 'whatsapp'
              ? 'btn-skull-primary font-semibold'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <span className="text-white">Línea WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brand')}
          className={`px-4 py-2 rounded-sm text-xs uppercase tracking-[0.16em] font-medium editorial-transition ${
            activeTab === 'brand'
              ? 'btn-skull-primary font-semibold'
              : 'text-zinc-300 hover:text-white'
          }`}
        >
          <span className="text-white">Identidad de Marca</span>
        </button>
      </div>

      {/* PESTAÑA 1: CARRUSEL DE ENTRADA (INICIO) */}
      {activeTab === 'carousel' && (
        <form onSubmit={handleSaveBrand} className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E0A14] border border-[#261C31] rounded-md p-4 sm:p-5">
            <div>
              <h2 className="font-display text-lg text-white">
                Diapositivas de Presentación ({slides.length})
              </h2>
              <p className="text-xs text-zinc-300">
                Edita los textos sobre la empresa, títulos e imágenes que rotan en la entrada del catálogo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddSlide}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.16em] font-semibold"
            >
              <Plus className="w-4 h-4 text-[#C8A97E]" />
              <span className="text-white">Agregar Diapositiva</span>
            </button>
          </div>

          <div className="space-y-4">
            {slides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="bg-[#0E0A14] border border-[#261C31] rounded-md p-4 sm:p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-[#261C31] pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2 py-0.5 bg-[#150E1D] border border-[#3A2B4C] text-[#C8A97E]">
                      0{idx + 1}
                    </span>
                    <span className="font-display text-base text-white">
                      {slide.title || `Diapositiva ${idx + 1}`}
                    </span>
                  </div>

                  {slides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(idx)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-rose-950/60 border border-rose-500/40 text-xs text-white hover:bg-rose-900/70"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-300" />
                      <span>Eliminar</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-white">
                      Etiqueta Superior (Badge)
                    </label>
                    <input
                      type="text"
                      value={slide.badge}
                      onChange={(e) =>
                        handleSlideChange(idx, 'badge', e.target.value)
                      }
                      placeholder="SKULL • UN NUEVO DESPERTAR"
                      className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-white">
                      Título Principal de la Diapositiva
                    </label>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) =>
                        handleSlideChange(idx, 'title', e.target.value)
                      }
                      placeholder="Arte corporal y joyería que despierta tu esencia"
                      className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider text-white">
                    Descripción sobre la Empresa / Estudio
                  </label>
                  <textarea
                    rows={2}
                    value={slide.subtitle}
                    onChange={(e) =>
                      handleSlideChange(idx, 'subtitle', e.target.value)
                    }
                    placeholder="Describe aquí la calidad, historia o filosofía de SKULL..."
                    className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-white">
                      Texto del Botón
                    </label>
                    <input
                      type="text"
                      value={slide.ctaLabel || ''}
                      onChange={(e) =>
                        handleSlideChange(idx, 'ctaLabel', e.target.value)
                      }
                      placeholder="Ver Catálogo"
                      className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider text-white">
                      Destino del Botón
                    </label>
                    <select
                      value={slide.ctaHref || '/catalogo'}
                      onChange={(e) =>
                        handleSlideChange(idx, 'ctaHref', e.target.value)
                      }
                      className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-xs text-white"
                    >
                      <option value="/catalogo">Catálogo Completo (/catalogo)</option>
                      <option value="whatsapp">Abrir WhatsApp Directo</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {slide.imageUrl && (
                      <img
                        src={slide.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-sm object-cover border border-[#3A2B4C] flex-shrink-0"
                      />
                    )}
                    <label className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-md btn-skull-secondary text-xs uppercase tracking-wider">
                      {uploadingSlideIdx === idx ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Camera className="w-3.5 h-3.5 text-[#C8A97E]" />
                      )}
                      <span className="text-white">Subir Imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSlideImageUpload(idx, e)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              <Save className="w-4 h-4 text-white" />
              <span className="text-white">
                {saving ? 'Guardando...' : 'Guardar Carrusel de Entrada'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* PESTAÑA 2: LÍNEA WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <form
          onSubmit={handleSaveWhatsApp}
          className="bg-[#0E0A14] border border-[#261C31] rounded-md p-5 sm:p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Número de WhatsApp (Con código de país) *
              </label>
              <input
                type="text"
                required
                value={waForm.phoneNumber}
                onChange={(e) =>
                  setWaForm({ ...waForm, phoneNumber: e.target.value })
                }
                placeholder="573001234567"
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] font-mono text-sm text-white focus:outline-none focus:border-white"
              />
              <p className="text-[11px] font-mono text-[#C8A97E]">
                {normalizedPreviewPhone
                  ? `Formato internacional activo: +${normalizedPreviewPhone} (wa.me/${normalizedPreviewPhone})`
                  : 'Ingresa al menos 10 dígitos con código de país (ej: 573001234567)'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Etiqueta del Botón Flotante
              </label>
              <input
                type="text"
                value={waForm.floatingButtonLabel}
                onChange={(e) =>
                  setWaForm({ ...waForm, floatingButtonLabel: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs uppercase tracking-wider text-white">
              Mensaje de Saludo General
            </label>
            <textarea
              rows={2}
              value={waForm.generalGreeting}
              onChange={(e) =>
                setWaForm({ ...waForm, generalGreeting: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white focus:outline-none focus:border-white"
            />
          </div>

          {/* Vista Previa de los Mensajes Dinámicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#261C31]">
            <div className="p-3.5 rounded-sm bg-[#070709] border border-[#261C31] space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8A97E] font-semibold">
                Vista Previa • Botón 1: Consultar Disponibilidad
              </span>
              <pre className="font-mono text-[11px] text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {sampleAvailabilityMsg}
              </pre>
            </div>

            <div className="p-3.5 rounded-sm bg-[#070709] border border-[#261C31] space-y-1.5">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8A97E] font-semibold">
                Vista Previa • Botón 2: Solicitar una Cita
              </span>
              <pre className="font-mono text-[11px] text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {sampleAppointmentMsg}
              </pre>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Horario de Atención
              </label>
              <input
                type="text"
                value={waForm.businessHoursNote}
                onChange={(e) =>
                  setWaForm({ ...waForm, businessHoursNote: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>

            <label className="flex items-center gap-3 p-3.5 rounded-md bg-[#070709] border border-[#3A2B4C] cursor-pointer">
              <input
                type="checkbox"
                checked={waForm.showFloatingButton}
                onChange={(e) =>
                  setWaForm({ ...waForm, showFloatingButton: e.target.checked })
                }
                className="w-4 h-4 accent-purple-500"
              />
              <div>
                <span className="block text-xs font-semibold text-white">
                  Mostrar Botón WhatsApp Flotante
                </span>
                <span className="text-[11px] text-zinc-300">
                  Visible en la esquina inferior del catálogo
                </span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            {sampleWhatsAppUrl && (
              <a
                href={sampleWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#C8A97E] hover:text-white"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Probar mensaje en WhatsApp</span>
              </a>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              <Save className="w-4 h-4 text-white" />
              <span className="text-white">
                {saving ? 'Guardando...' : 'Guardar Configuración'}
              </span>
            </button>
          </div>
        </form>
      )}

      {/* PESTAÑA 3: IDENTIDAD DE MARCA */}
      {activeTab === 'brand' && (
        <form
          onSubmit={handleSaveBrand}
          className="bg-[#0E0A14] border border-[#261C31] rounded-md p-5 sm:p-6 space-y-5"
        >
          <div className="flex items-center gap-4">
            <img
              src={brandForm.logoUrl || '/images/logo-skull.png'}
              alt="Logo SKULL"
              className="w-14 h-14 rounded-full border border-white/40 object-cover bg-black"
            />
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md btn-skull-secondary text-xs uppercase tracking-wider">
              {uploadingLogo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-[#C8A97E]" />
              )}
              <span className="text-white">Reemplazar Emblema</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Nombre de Marca
              </label>
              <input
                type="text"
                value={brandForm.siteName}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, siteName: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Subtítulo Editorial
              </label>
              <input
                type="text"
                value={brandForm.tagline}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, tagline: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Moneda
              </label>
              <select
                value={brandForm.currency}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, currency: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] font-mono text-sm text-white"
              >
                <option value="COP">COP ($)</option>
                <option value="MXN">MXN ($)</option>
                <option value="USD">USD ($)</option>
                <option value="PEN">PEN (S/)</option>
                <option value="ARS">ARS ($)</option>
                <option value="CLP">CLP ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2.5 border-t border-[#261C31] pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white">
                  Cintillo Superior · Mensajes Rotativos
                </label>
                <p className="text-[11px] text-zinc-300">
                  Se desplazan uno a uno en la barra superior. Máximo{' '}
                  {ANNOUNCEMENT_MAX_MESSAGES} mensajes de{' '}
                  {ANNOUNCEMENT_MAX_LENGTH} caracteres para no pasar de dos
                  renglones.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddAnnouncement}
                disabled={announcementMessages.length >= ANNOUNCEMENT_MAX_MESSAGES}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-sm btn-skull-secondary text-xs uppercase tracking-[0.16em] font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5 text-[#C8A97E]" />
                <span className="text-white">Agregar mensaje</span>
              </button>
            </div>

            <div className="space-y-2">
              {announcementMessages.map((message, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-16 flex-shrink-0 font-mono text-[11px] text-[#C8A97E]">
                    0{idx + 1}{' '}
                    <span className="text-zinc-500">
                      {message.length}/{ANNOUNCEMENT_MAX_LENGTH}
                    </span>
                  </span>
                  <input
                    type="text"
                    value={message}
                    maxLength={ANNOUNCEMENT_MAX_LENGTH}
                    onChange={(e) =>
                      handleAnnouncementChange(idx, e.target.value)
                    }
                    placeholder={`Mensaje ${idx + 1}`}
                    className="flex-1 px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAnnouncement(idx)}
                    aria-label={`Eliminar mensaje ${idx + 1}`}
                    className="flex-shrink-0 p-2 rounded-sm bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900/70"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <p className="font-mono text-[11px] text-[#C8A97E]">
              {announcementMessages.filter((m) => m.trim()).length}/5 mensajes activos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Ubicación / Estudio
              </label>
              <input
                type="text"
                value={brandForm.locationText}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, locationText: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Usuario de Instagram
              </label>
              <input
                type="text"
                value={brandForm.instagramHandle}
                onChange={(e) =>
                  setBrandForm({
                    ...brandForm,
                    instagramHandle: e.target.value,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                URL de Instagram
              </label>
              <input
                type="url"
                value={brandForm.instagramUrl}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, instagramUrl: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>
          </div>

          {/* Presentación de la Propietaria o del Establecimiento */}
          <div className="pt-4 border-t border-[#261C31] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-base text-white">
                  Presentación de la Propietaria / Establecimiento
                </h3>
                <p className="text-xs text-zinc-300">
                  Se muestra en la página principal para transmitir confianza y profesionalismo.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandForm.showStudioSection !== false}
                  onChange={(e) =>
                    setBrandForm({
                      ...brandForm,
                      showStudioSection: e.target.checked,
                    })
                  }
                  className="accent-purple-500"
                />
                <span>Mostrar en Inicio</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-white">
                  Nombre de Propietaria / Estudio
                </label>
                <input
                  type="text"
                  value={brandForm.studioOwnerName || ''}
                  onChange={(e) =>
                    setBrandForm({
                      ...brandForm,
                      studioOwnerName: e.target.value,
                    })
                  }
                  placeholder="Propietaria & Especialista en Piercing"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase tracking-wider text-white">
                  Cargo / Especialidad
                </label>
                <input
                  type="text"
                  value={brandForm.studioOwnerRole || ''}
                  onChange={(e) =>
                    setBrandForm({
                      ...brandForm,
                      studioOwnerRole: e.target.value,
                    })
                  }
                  placeholder="Fundadora de SKULL – Un Nuevo Despertar"
                  className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Título de Presentación del Establecimiento
              </label>
              <input
                type="text"
                value={brandForm.studioTitle || ''}
                onChange={(e) =>
                  setBrandForm({ ...brandForm, studioTitle: e.target.value })
                }
                placeholder="Un espacio privado dedicado al arte corporal seguro..."
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase tracking-wider text-white">
                Descripción de la Propietaria o del Establecimiento
              </label>
              <textarea
                rows={3}
                value={brandForm.studioDescription || ''}
                onChange={(e) =>
                  setBrandForm({
                    ...brandForm,
                    studioDescription: e.target.value,
                  })
                }
                placeholder="Describe aquí la experiencia, protocolos de higiene y filosofía de atención..."
                className="w-full px-3.5 py-2.5 rounded-md bg-[#070709] border border-[#3A2B4C] text-sm text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md btn-skull-primary text-xs uppercase tracking-[0.18em] font-semibold"
            >
              <Save className="w-4 h-4 text-white" />
              <span className="text-white">
                {saving ? 'Guardando...' : 'Guardar Identidad'}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
