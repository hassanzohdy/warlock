import { groupedTranslations } from "@mongez/localization";

groupedTranslations("validation", {
  required: {
    en: "The :input field is required.",
    ar: ":input مطلوب.",
  },
  unique: {
    en: "The :input has already been taken.",
    ar: ":input مستخدم من قبل.",
  },
  object: {
    en: ":input must be an object.",
    ar: ":input يجب أن يكون كائن.",
  },
  exists: {
    en: "The selected :input does not exist in our database records.",
    ar: ":input المحدد غير موجود في سجلات قاعدة البيانات الخاصة بنا.",
  },
  confirmed: {
    en: ":input must match :confirmationInput.",
    ar: ":input يجب أن يتطابق مع :confirmationInput.",
  },
  minLength: {
    en: ":input must be at least :min characters.",
    ar: ":input يجب أن يكون على الأقل :min حرف.",
  },
  maxLength: {
    en: ":input must be at most :max characters.",
    ar: ":input يجب أن يكون على الأكثر :max حرف.",
  },
  email: {
    en: "The :input must be a valid email address.",
    ar: ":input يجب أن يكون بريد إلكتروني صالح.",
  },
  localized: {
    en: ":input must be a an array of objects, each object has localeCode and text properties.",
    ar: ":input يجب أن يكون مصفوفة من الكائنات، كل كائن يحتوي على خصائص localeCode و text.",
  },
  in: {
    en: ":input accepts only the following values: :values.",
    ar: ":input يقبل القيم التالية فقط: :values.",
  },
  string: {
    en: ":input must be a string.",
    ar: ":input يجب أن يكون سلسلة.",
  },
  number: {
    en: ":input must be a number.",
    ar: ":input يجب أن يكون رقم.",
  },
  integer: {
    en: ":input must be an integer.",
    ar: ":input يجب أن يكون عدد صحيح.",
  },
  float: {
    en: ":input must be a float.",
    ar: ":input يجب أن يكون عدد عائم.",
  },
  boolean: {
    en: ":input must be a boolean.",
    ar: ":input يجب أن يكون منطقي.",
  },
  pattern: {
    en: ":input must match the following pattern: :pattern.",
    ar: ":input يجب أن يتطابق مع النمط التالي: :pattern.",
  },
  array: {
    en: ":input must be an array.",
    ar: ":input يجب أن يكون مصفوفة.",
  },
  arrayOf: {
    en: ":input must be an array of :type.",
    ar: ":input يجب أن يكون مصفوفة من :type.",
  },
});
