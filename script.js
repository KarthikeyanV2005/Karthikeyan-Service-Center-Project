/* ==========================================================================
   Karthikeyan Service Center — script
   ========================================================================== */

/* ==========================================================================
   CONFIGURATION — WORKSHOP WHATSAPP NUMBER
   Country code + number, digits only: no "+", spaces, or hyphens.
   Source: workshop phone number shown in the Figma design (+91 9941452671).
   Confirm this number is registered on WhatsApp. If WhatsApp reports that
   the number is not on WhatsApp, replace it with the correct number here.
   ========================================================================== */
const WHATSAPP_NUMBER = "919941452671";

(function () {
  "use strict";

  const form = document.getElementById("booking-form");
  const statusEl = document.getElementById("form-status");
  const menuToggle = document.querySelector(".menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const nameInput = document.getElementById("customer-name");
  const phoneInput = document.getElementById("customer-phone");
  const vehicleInput = document.getElementById("vehicle-model");
  const serviceSelect = document.getElementById("service-type");
  const notesInput = document.getElementById("problem-notes");

  /* Valid only when the number is digits only, with country code, and not a placeholder */
  const isWhatsAppConfigured = /^\d{10,15}$/.test(WHATSAPP_NUMBER) && !/YOUR/i.test(WHATSAPP_NUMBER);
  const NOT_CONFIGURED_MESSAGE = "WhatsApp booking is not connected yet. Please call the workshop directly on 9941452671.";

  /* ---------- WhatsApp links (contact card and footer) ---------- */
  function buildWhatsAppBaseUrl() {
    return "https://wa.me/" + encodeURIComponent(WHATSAPP_NUMBER);
  }

  /* Links only get a real wa.me URL when the number is valid.
     Otherwise the click is stopped and a clear message is shown. */
  document.querySelectorAll("#whatsapp-link, [data-whatsapp-link]").forEach(function (link) {
    if (isWhatsAppConfigured) {
      link.href = buildWhatsAppBaseUrl();
      return;
    }
    link.addEventListener("click", function (event) {
      event.preventDefault();
      if (statusEl) {
        statusEl.textContent = NOT_CONFIGURED_MESSAGE;
        statusEl.classList.add("is-error");
      }
      console.warn("WhatsApp number is not configured correctly in script.js.");
    });
  });

  /* ---------- Mobile navigation ---------- */
  if (menuToggle && siteNav) {
    menuToggle.addEventListener("click", function () {
      const isOpen = siteNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    siteNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        siteNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Scroll to booking form, then focus the first field ---------- */
  function focusBookingForm() {
    if (!nameInput) return;
    window.setTimeout(function () {
      nameInput.focus({ preventScroll: true });
    }, 600);
  }

  document.querySelectorAll("[data-scroll-booking]").forEach(function (trigger) {
    trigger.addEventListener("click", focusBookingForm);
  });

  /* "Enquire About This Service" links pre-select the matching service */
  document.querySelectorAll("[data-service]").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      const wanted = trigger.getAttribute("data-service");
      if (serviceSelect && wanted) {
        const option = Array.prototype.find.call(serviceSelect.options, function (opt) {
          return opt.value === wanted;
        });
        if (option) serviceSelect.value = option.value;
      }
      focusBookingForm();
    });
  });

  /* ---------- Validation ---------- */
  function setFieldError(input, message) {
    const field = input.closest(".field");
    const errorEl = field ? field.querySelector(".field-error") : null;
    if (message) {
      input.setAttribute("aria-invalid", "true");
      if (field) field.classList.add("has-error");
    } else {
      input.removeAttribute("aria-invalid");
      if (field) field.classList.remove("has-error");
    }
    if (errorEl) errorEl.textContent = message || "";
  }

  function validateName() {
    const value = nameInput.value.trim();
    if (!value) return setFieldError(nameInput, "Please enter your name."), false;
    if (value.length < 2) return setFieldError(nameInput, "Please enter your full name."), false;
    setFieldError(nameInput, "");
    return true;
  }

  function validatePhone() {
    const value = phoneInput.value.trim();
    const digits = value.replace(/\D/g, "");
    if (!value) return setFieldError(phoneInput, "Please enter your phone number."), false;
    if (!/^\+?[\d\s-]+$/.test(value) || digits.length < 10 || digits.length > 13) {
      return setFieldError(phoneInput, "Please enter a valid phone number."), false;
    }
    setFieldError(phoneInput, "");
    return true;
  }

  function validateVehicle() {
    const value = vehicleInput.value.trim();
    if (!value) return setFieldError(vehicleInput, "Please enter your bike or scooter model."), false;
    setFieldError(vehicleInput, "");
    return true;
  }

  function validateService() {
    if (!serviceSelect.value) return setFieldError(serviceSelect, "Please choose a service."), false;
    setFieldError(serviceSelect, "");
    return true;
  }

  /* Notes are optional: nothing to validate. */

  nameInput.addEventListener("blur", validateName);
  phoneInput.addEventListener("blur", validatePhone);
  vehicleInput.addEventListener("blur", validateVehicle);
  serviceSelect.addEventListener("change", validateService);

  [nameInput, phoneInput, vehicleInput].forEach(function (input) {
    input.addEventListener("input", function () {
      if (input.getAttribute("aria-invalid") === "true") {
        input.dispatchEvent(new Event("blur"));
      }
    });
  });

  /* ---------- WhatsApp message ---------- */
  function buildMessage(data) {
    const lines = [
      "Hello, I would like to book an appointment or inspection.",
      "",
      "Name: " + data.name,
      "Phone: " + data.phone,
      "Vehicle: " + data.vehicle,
      "Service Required: " + data.service,
      "Problem Notes: " + (data.notes || "None provided"),
      "",
      "Please let me know your availability. Thank you!"
    ];
    return lines.join("\n");
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.classList.toggle("is-error", Boolean(isError));
  }

  /* ---------- Submit ---------- */
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    setStatus("");

    const validations = [validateName(), validatePhone(), validateVehicle(), validateService()];
    if (validations.indexOf(false) !== -1) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    if (!isWhatsAppConfigured) {
      setStatus("Booking is not connected yet. Please call the workshop directly.", true);
      console.warn("WhatsApp number is not configured. Set WHATSAPP_NUMBER in script.js.");
      return;
    }

    const message = buildMessage({
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      vehicle: vehicleInput.value.trim(),
      service: serviceSelect.value,
      notes: notesInput.value.trim()
    });

    const url = buildWhatsAppBaseUrl() + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener");
    setStatus("WhatsApp is opening. Press Send inside WhatsApp to submit your enquiry. The workshop will confirm the date and time with you there.");
  });
})();
