/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Accordion, Button, Checkbox, Label, Modal, Select, Spinner, Tabs, TextInput, ToggleSwitch } from "flowbite-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HiAdjustments, HiCollection, HiColorSwatch, HiInformationCircle, HiPencil, HiX } from "react-icons/hi";
import { IoMdCloseCircle } from "react-icons/io";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthProvider";
import { useLoading } from "../../context/LoadingContext";
import apiClient from "../../utils/AxiosInstance";
import { CompanyField, createQueryParams, RestaurantField } from "../../utils/functions";
import { FormHeaderPaths } from "../../utils/HeaderPaths";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import FormLoader from "../../utils/common/FormLoader";
import { allowedImageExtensions, FILE_SIZE_LIMIT, languages, OWNER_ROLES, SUPER_ADMIN } from "../../utils/common/constant";
import { DropdownWithSearch } from "../../utils/common/Filters";
import { RxCross2 } from "react-icons/rx";
import { RiDeleteBin6Line } from "react-icons/ri";
import { apiUrl, siteUrl } from "../../environment/env";
import { formatDate, formatTime, setTitle } from "../../utils/utility";
import IngredientTable from "./IngredientTable";
import IngredientsForm from "./IngredientsForm";
import { useConfigs } from "../../context/SiteConfigsProvider";
import NumberInputPOS from "../../utils/common/NumberInputPOS";
import CommonInput from "../../utils/common/CommonInput";


export type LanguageCode = typeof languages[number]['code'];
export type ITranslation = {
  [key in LanguageCode]?: string;
};

interface ICategory {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  taxes: string[] | null;
}
interface IProduct {
  _id: string;
  name: string;
  nameMl?: ITranslation;
  description: string;
  descriptionMl?: ITranslation;
  price: number;
  sku: string;
  modifiers: IModifier[];
  category: ICategory;
  stock: number;
  isAvailable: boolean;
  unit: string;
  applicableTax: string;
  sellingPriceTaxType: string;
  type: string;
  background: string,
  fontType: string,
  fontSize: string,
  fontColor: string,
  itemColor: string,
  company: string,
  restaurant: string;
  image: File | null;
  usedCatTax: boolean;
}
interface ErrorState {
  name?: string;
  description?: string;
  price?: string;
  sku?: string;
  modifiers?: string;
  category?: string;
  stock?: string;
  isAvailable?: string;
  company?: string;
  restaurant?: string;
  image?: string;
}
interface IModifier {
  _id: string;
  category: {
    _id: string;
    name: string;
  }
  name: string;
  description: string;
  categoryName: string;
}

const ProductForm = () => {
  const { id } = useParams()
  const { userData } = useAuth();
  const { configData } = useConfigs();
  const loginRole = userData?.staffMember?.role?.name || SUPER_ADMIN;
  const navigate = useNavigate();

  const emptyTranslations: ITranslation = languages.reduce((acc: any, lang: any) => {
    acc[lang.code] = '';
    return acc;
  }, {} as ITranslation);
  const initialForm = {
    _id: '',
    name: '',
    nameMl: emptyTranslations,
    description: '',
    descriptionMl: emptyTranslations,
    price: '',
    sku: '',
    forcedQuestions: [],
    openQuestions: [],
    modifiers: [],
    selectedFQs: [],
    category: '',
    stock: '',
    isAvailable: true,
    unit: '',
    applicableTax: '',
    sellingPriceTaxType: '',
    type: '',
    background: '',
    fontType: '',
    fontSize: '',
    fontColor: '',
    itemColor: '',
    company: '',
    restaurant: '',
    taxes: [],
    usedCatTax: false,
    image: null,
  }
  const [formData, setFormData] = useState<IProduct | any>(initialForm);

  const [modifiers, setModifiers] = useState<any[]>([]);
  const [categorys, setCategorys] = useState<ICategory[]>([]);
  const [errors, setErrors] = useState<ErrorState>({});
  // const [visibleCategory, setVisibleCategory] = useState<string | null>(null);
  const [visible, setVisible] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { isLoading, setIsLoading, isButtonLoading, setIsButtonLoading, setSaveAnswer, addQuestion, setAddQuestion } = useLoading();

  const [forcedQuestions, setForcedQuestions] = useState<any>([]);
  // const [openQuestions, setopenQuestions] = useState<any>([]);
  const [openQuestionModal, setOpenQuestionModal] = useState<any>(false);
  const [openAnswerModal, setOpenAnswerModal] = useState<any>(false);
  // const [allModifiers, setAllModifiers] = useState<any>([]);
  const [selectedFQs, setSelectedFQs] = useState<any>([]);
  const [selectedFQAnswer, setSelectedFQAnswer] = useState<any>([]);
  const [forcedQuestionFormData, setForcedQuestionFormData] = useState<any>({
    question: '',
    question_level: 1,
    noOfChoice: 0,
    isActive: true,
    enforceAnswer: false,
    answers: []
  });
  const NoImage = `${siteUrl}/images/default_food.png`;
  const [, setIsFileEdit] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | any>("");

  const [validFQ, setValidFQ] = useState<any>({});
  const [allTaxes, setAllTaxes] = useState<any>([]);
  const [selectedTax, setSelectedTax] = useState<any>([]);
  const [companies, setCompanies] = useState<any>([]);
  const [restaurant, setRestaurant] = useState<any>([]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const matchingCategories = modifiers
        .filter((cat) =>
          cat?.modifier?.some((mod: any) =>
            mod?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
        .map((cat) => cat.categoryName);

      setVisible(matchingCategories);
    } else {
      setVisible(modifiers?.length ? [modifiers[0]?.categoryName] : []);
    }
  }, [searchTerm, modifiers]);

  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [ingredients, setIngredients] = useState<any>([]);
  const [currentIngredientIndex, setCurrentIngredientIndex] = useState<number | null>(null);

  const prepareProductFormData = (formData: IProduct): FormData => {
    const formDataToSend = new FormData();

    const simpleFields: (keyof IProduct)[] = [
      '_id', 'name', 'nameMl', 'description', 'descriptionMl', 'price', 'sku', 'category', 'stock', 'isAvailable',
      'unit', 'applicableTax', 'sellingPriceTaxType', 'type', 'background', 'fontType',
      'fontSize', 'fontColor', 'itemColor', 'company', 'restaurant', 'usedCatTax'
    ];

    simpleFields.forEach((field) => {
      const value = formData[field];

      if (value !== undefined && value !== null) {
        if (
          typeof value === "object" &&
          !(value instanceof File)
        ) {
          formDataToSend.append(field, JSON.stringify(value));
        } else {
          formDataToSend.append(field, String(value));
        }
      }
    });

    if (selectedFile) {
      formDataToSend.append('image', selectedFile);
    } else if (formData.image) {
      formDataToSend.append('image', formData.image as any);
    }


    if (selectedFQs) {
      formDataToSend.append("questions", JSON.stringify(selectedFQs));
    }

    if (selectedTax) {
      formDataToSend.append("taxes", JSON.stringify(selectedTax));
    }

    if (formData.modifiers && formData.modifiers.length > 0) {
      formDataToSend.append('modifiers', JSON.stringify(formData.modifiers));
    }

    if (ingredients && ingredients.length > 0) {
      formDataToSend.append('ingredients', JSON.stringify(ingredients));
    }

    return formDataToSend;
  };

  const getCompany = async () => {
    if (companiesLoadedRef.current) return;
    companiesLoadedRef.current = true;
    try {
      const response = await apiClient.get(`/business`);
      if (response.data.success) {
        setCompanies(response.data.companies)
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
  }

  const getRestaurant = async (companyId: string) => {
    try {
      const key = `rest-${companyId}`;
      if (restaurantsLoadedRef.current === key) return;
      restaurantsLoadedRef.current = key;
      const response = await apiClient.get(`/restaurant/company/${companyId}`);
      if (response.data.success) {
        setRestaurant(response.data.restaurant);
        return response.data.restaurant;
      }
    } catch (error: any) {
      console.log("error", error.message);
    }
    return [];
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof ErrorState]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleChangeWithLang = (field: string, lang: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [lang]: value,
      },
    }));
  };

  const handleModifierToggle = (modifier: IModifier) => {
    setSelectedFQAnswer((prev: any) => {
      const exists = prev.some((m: any) => m._id === modifier._id);
      if (exists) {
        return prev.filter((m: any) => m._id !== modifier._id);
      } else {
        return [...prev, modifier];
      }
    });

    setFormData((prev: any) => {
      const exists = prev.modifiers.some((m: any) => m._id === modifier._id);
      return {
        ...prev,
        modifiers: exists
          ? prev.modifiers.filter((m: any) => m._id !== modifier._id)
          : [...prev.modifiers, modifier],
      };
    });

    setErrors(prev => ({ ...prev, modifiers: "" }));
  };

  const validateImage = (file: File): string | null => {
    const maxSizeMB = FILE_SIZE_LIMIT;
    const extname = file.name.split(".").pop()?.toLowerCase();

    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size should be less than or equal to ${maxSizeMB} MB.`;
    }

    if (!extname || !allowedImageExtensions.includes(extname)) {
      return "Please select a valid image file (jpeg, png, gif, webp).";
    }

    return null; // Valid
  };

  const companyRef = useRef<HTMLSelectElement | any>(null);
  const restaurantRef = useRef<HTMLSelectElement | any>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const taxesLoadedRef = useRef<string>('');
  const fqsLoadedRef = useRef<string>('');
  const restaurantsLoadedRef = useRef<string>('');
  const companiesLoadedRef = useRef(false);
  const categoriesLoadedRef = useRef<string>('');
  const modifiersLoadedRef = useRef<string>('');

  const isValid = (): boolean => {
    let isValid = true;
    const errorMsg: Partial<ErrorState> = {};
    let firstErrorRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> | null = null;

    if (selectedFile) {
      const imageValidationError = validateImage(selectedFile);
      if (imageValidationError) {
        errorMsg.image = imageValidationError;
        isValid = false;
        firstErrorRef = imageRef;
      }
    }

    if (loginRole === SUPER_ADMIN && !formData.company) {
      errorMsg.company = "Please select a business.";
      if (!firstErrorRef) {
        firstErrorRef = companyRef;
      };
      isValid = false;
    }
    if (loginRole === SUPER_ADMIN && !formData.restaurant) {
      errorMsg.restaurant = "Please select a restaurant.";
      if (!firstErrorRef) {
        firstErrorRef = restaurantRef;
      };
      isValid = false;
    }

    if (!formData.name) {
      errorMsg.name = "Please enter name.";
      if (!firstErrorRef) {
        firstErrorRef = nameRef;
      };
      isValid = false;
    }
    if (!formData.category) {
      errorMsg.category = "Please select a category.";
      if (!firstErrorRef) {
        firstErrorRef = categoryRef;
      };
      isValid = false;
    }
    if (!formData.price) {
      errorMsg.price = "Please enter a price.";
      if (!firstErrorRef) {
        firstErrorRef = priceRef;
      }
      isValid = false;
    } else if (!/^\d*\.?\d+$/.test(formData.price)) {
      errorMsg.price = "Price must be a valid number.";
      isValid = false;
    } else if (Number(formData.price) < 0) {
      errorMsg.price = "Price must be 0 or greater.";
      isValid = false;
    }

    if (formData.stock !== "" && formData.stock !== null && formData.stock !== undefined) {
      if (isNaN(Number(formData.stock))) {
        errorMsg.stock = "Stock must be a valid number.";
        isValid = false;
      } else if (Number(formData.stock) < 0) {
        errorMsg.stock = "Stock cannot be negative.";
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, ...errorMsg }));
    if (firstErrorRef && firstErrorRef.current) {
      firstErrorRef.current.focus();
      firstErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    return isValid;
  };

  const getModifiers = async (company: string, restaurant?: string) => {
    const key = `mod-${company}-${restaurant || ''}`;
    if (modifiersLoadedRef.current === key) return;
    modifiersLoadedRef.current = key;
    try {
      // Fetch the modifiers
      const queryParam = createQueryParams({ company, restaurant })
      const { data } = await apiClient.get(`/modifier${queryParam}`,);
      const modifiersData = data?.modifiers as IModifier[] || [];

      // Filter and group active modifiers by category
      const groupedModifiers: any = modifiersData
        .filter((modifier: any) => modifier.modifierCategory?.isActive)  // Only include active modifiers
        .reduce((acc, modifier: any) => {
          const { name: categoryName } = modifier.modifierCategory!;

          // Find or create category group
          let categoryGroup: any = acc.find(group => group.categoryName === categoryName);
          if (!categoryGroup) {
            categoryGroup = { categoryName, modifier: [] };
            acc.push(categoryGroup);
          }

          // Add modifier to category group
          categoryGroup.modifier.push({
            _id: modifier._id,
            category: modifier.category,
            modifierCategory: modifier.modifierCategory,
            name: modifier.name,
            price: modifier.price,
            isAvailable: modifier.isAvailable,
            description: modifier.description,
            updatedAt: modifier.updatedAt
          });

          return acc;
        }, [] as Array<{ categoryName: string; modifier: IModifier[] }>);

      // Warn if no active categories are found
      if (!groupedModifiers.length) {
        console.warn("No active modifier categories found.");
      }

      // Set the grouped modifiers to state
      setModifiers(groupedModifiers);

      // Optionally, set the first category to visible
      setVisible([groupedModifiers[0]?.categoryName]);

    } catch (error: any) {
      console.error("Error fetching modifiers:", error.message);
    }
  };

  const getCategory = async (company?: string, restaurant?: string) => {
    const key = `cat-${company || ''}-${restaurant || ''}`;
    if (categoriesLoadedRef.current === key) return;
    categoriesLoadedRef.current = key;
    try {
      const quueryParams = createQueryParams({ company, restaurant })
      const response = await apiClient.get(`/category${quueryParams}`);
      setCategorys(response.data?.categories);
    } catch (error) {
      console.error("~ get category error :-", error);
    }
  };

  useEffect(() => {
    const companyId = userData?.staffMember?.company?._id;
    const isOwner = OWNER_ROLES.includes(loginRole);
    const isSuperAdmin = loginRole === SUPER_ADMIN;
    const company = formData?.company?._id || formData?.company;
    const restaurant = formData?.restaurant?._id || formData?.restaurant;

    if (isSuperAdmin) {
      getCompany();
    }

    if (isSuperAdmin && company) {
      getAllFQs(company);
      getRestaurant(company);
    }

    if (!isSuperAdmin && isOwner && companyId && !company) {
      getAllFQs(companyId);
      if (!company) {
        getRestaurant(companyId);
      }
    }

    if (company && restaurant) {
      getCategory(company, restaurant);
      getModifiers(company, restaurant);
    }

    if (!id) {
      getAllTax();
    }
  }, [loginRole, formData?.company, formData?.restaurant, id]);

  // Auto-select company if single
  useEffect(() => {
    if (companies?.length === 1 && loginRole === SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: companies[0]._id }));
      setErrors((prev: any) => ({ ...prev, company: "" }));
    }
  }, [companies, loginRole]);

  // Set company for non-SUPER_ADMIN
  useEffect(() => {
    if (loginRole !== SUPER_ADMIN) {
      setFormData((prev: any) => ({ ...prev, company: userData?.staffMember?.company?._id }));
    }
  }, [loginRole, userData]);

  // Auto-select restaurant if single
  useEffect(() => {
    if (restaurant?.length === 1) {
      const restaurantId = restaurant[0]._id;
      setFormData((prev: any) => ({ ...prev, restaurant: restaurantId }));
      setErrors((prev: any) => ({ ...prev, restaurant: "" }));
      const companyId = formData.company?._id || formData.company || userData?.staffMember?.company?._id;
      if (companyId && restaurantId) {
        getCategory(companyId, restaurantId);
        getModifiers(companyId, restaurantId);
      }
      setSelectedTax([]);
    }
  }, [restaurant]);

  // Auto-select category if single
  useEffect(() => {
    if (categorys?.length === 1 && !formData.category) {
      const categoryId = categorys[0]._id;
      setFormData((prev: any) => ({ ...prev, category: categoryId }));
      setErrors((prev: any) => ({ ...prev, category: "" }));
    }
  }, [categorys]);


  const getProduct = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.get(`/product/${id}`);
      if (response.data.success) {
        const product = response.data?.product;
        getModifiers(product?.company?._id, product?.restaurant?._id);
        getAllTax(product?.company?._id, product?.restaurant?._id);
        getCategory(product?.company?._id, product?.restaurant?._id);
        // getAllFQs(product?.company?._id);
        setSelectedFQs(product?.questions.map((question: any) => question._id));


        if (product?.ingredients) {
          setIngredients(product?.ingredients);
        }


        setFormData((prev: any) => ({
          ...prev,
          ...product,
          modifiers: product.modifiers || [],
          selectedFQs: product.selectedFQs || [],
          category: product.category?._id || '',
          company: product.company?._id || "",
          restaurant: product.restaurant?._id || "",
        }));

        setSelectedTax(product?.taxes || []);
        const initialSelectedIds = (product?.taxes || []).map((tax: any) => tax._id);
        setSelectedTaxIds(initialSelectedIds);
        setTitle(product?.name);
      }

      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false)
      toast.error(error?.response?.data?.message ? error?.response?.data?.message : error?.message);
    }
  }, [id, setIsLoading]);

  useEffect(() => {
    if (id) {
      if (formData?.company) {
        getRestaurant(formData?.company);
      }
    }
  }, [formData?.company]);

  useEffect(() => {
    if (id) {
      getProduct();
      // getModifiers(formData?.company?._id);
    } else {
      setTitle("Product Form")
    }
  }, [id]);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.name) {
      formData.nameMl = { ...formData.nameMl, en: formData.name };
    }
    formData.nameMl = JSON.stringify(formData.nameMl);

    formData.descriptionMl = {
      ...(typeof formData.descriptionMl === 'string' ? JSON.parse(formData.descriptionMl) : formData.descriptionMl),
      en: formData.description || ''
    };
    formData.descriptionMl = JSON.stringify(formData.descriptionMl)

    if (!isValid()) return;

    try {
      setIsButtonLoading(true);

      const formDataToSend = prepareProductFormData(formData);
      const isEdit = Boolean(id);
      const url = isEdit ? `/product/${id}` : '/product/add';
      const method = isEdit ? 'patch' : 'post';

      const response = await apiClient[method](url, formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const successMessage = isEdit ? 'Product updated successfully!' : 'Product added successfully!';
      const errorMessage = isEdit ? 'Failed to update product.' : 'There was an issue adding the product.';

      if (response?.data?.success) {
        toast.success(response?.data?.message || successMessage);
        navigate(-1);
        setFormData(initialForm);
        setErrors({});
      } else {
        toast.error(response?.data?.message || errorMessage);
      }

    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message);
    } finally {
      setIsButtonLoading(false);
    }
  };

  const handleToggleCategory = (categoryName: string) => {
    setVisible(prev => prev.includes(categoryName) ? prev.filter(c => c !== categoryName) : [...prev, categoryName]);
  };
  // const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSearchTerm(e.target.value.toLowerCase());
  // };
  const handleSetCategory = (category: any) => {
    const categoryId: any = categorys?.find((c: any) => c._id === category)

    setFormData((prev: any) => ({ ...prev, category: categoryId._id }));
    setSearchTerm("");
    setErrors(prev => ({ ...prev, category: "" }));
  };

  const handleChangeFQ = (e: any) => {
    const { name, value, checked, type } = e.target;

    let fieldValue: any = type === "checkbox" ? checked : value;

    // Prevent negative values for noOfChoice
    if (name === "noOfChoice") {
      fieldValue = value.replace(/[^0-9]/g, "");

      if (fieldValue !== "") {
        fieldValue = Number(fieldValue);
      }
    }

    setForcedQuestionFormData((prev: any) => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear error for the field being changed
    if (validFQ[name]) {
      setValidFQ((prev: any) => ({ ...prev, [name]: "" }));
    }
  };

  const saveForcedQuestion = async () => {
    const errorMsg: Partial<ErrorState | any> = {};
    let isValidFun = true;
    setQuestionId("");
    const isValid = () => {
      if (forcedQuestionFormData.question === "") {
        errorMsg.question = "Question is required";
        isValidFun = false;
      }
      setValidFQ(errorMsg);
      return isValidFun;
    };

    if (isValid()) {
      if (questionId) {
        setSaveAnswer(true);
      } else {
        setAddQuestion(true);
      }
      try {
        forcedQuestionFormData.answers = selectedFQAnswer;
        forcedQuestionFormData.company = formData?.company?._id || formData?.company;
        forcedQuestionFormData.restaurant = formData?.restaurant?._id || formData?.restaurant;
        if (questionId) {
          const response = await apiClient.post(`/product/fq/edit/${questionId}`, forcedQuestionFormData);
          if (response.data.success === true) {
            const updatedFqs = response?.data?.forceQuestion;
            setForcedQuestions((prev: any) =>
              prev.map((fq: any) => fq._id === updatedFqs._id ? updatedFqs : fq)
            );
            setFormData((prev: any) => ({ ...prev, modifiers: selectedFQAnswer }))
          } else {
            toast.error(response?.data?.message)
          }
        } else {
          const response = await apiClient.post('/product/fq/save', forcedQuestionFormData);
          if (response.data.success === true) {
            const newFqs = response?.data?.forceQuestion;
            setForcedQuestions((prev: any) => [...prev, newFqs]);
          } else {
            toast.error(response?.data?.message)
          }
        }
        handleCloseQuestionModal()
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message);
      } finally {
        if (questionId) {
          setSaveAnswer(false);
        } else {
          setAddQuestion(false);
        }
      }
    }
  };



  const removeModifier = (id: string) => {
    setSelectedFQAnswer((prevModifiers: any) => prevModifiers.filter((item: any) => item._id !== id));
  }

  const getAllFQs = async (company?: string) => {
    const key = `fq-${company || ''}`;
    if (fqsLoadedRef.current === key) return;
    fqsLoadedRef.current = key;
    const param = createQueryParams({ company: company })
    const response = await apiClient.get(`/product/fq/all${param}`);
    if (response) {
      setForcedQuestions(response?.data?.forceQuestions);
    }
  }
  const [_selectedIds, setSelectedIds] = useState(Array(6).fill(""));
  const [questionId, setQuestionId] = useState("");

  const handleQuestionChange = (index: any, value: any) => {
    if (value) {
      setSelectedFQs((prev: any) => {
        const updatedFQs = [...prev];
        updatedFQs[index] = value;
        return updatedFQs;
      });
      setSelectedIds((prev) => {
        const updatedFQs = [...prev];
        updatedFQs[index] = value;
        return updatedFQs;
      });
    } else {
      setSelectedFQs((prev: any) => prev.filter((_: any, i: any) => i !== index));
      setSelectedIds((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const getAllTax = async (company?: any, restaurant?: any) => {
    const key = `${company || ''}-${restaurant || ''}`;
    if (taxesLoadedRef.current === key) return;
    taxesLoadedRef.current = key;
    try {
      const param = { company: company, restaurant: restaurant };
      const response = await apiClient.get("/tax", { params: param });
      if (response?.data?.data) {
        setAllTaxes(response?.data?.data);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleTaxToggle = (tax: any) => {
    const updatedTaxes = selectedTax.filter((m: any) => m?._id !== tax?._id);
    const initialSelectedIds = updatedTaxes.map((tax: any) => tax._id);
    setSelectedTaxIds(initialSelectedIds);
    setSelectedTax(updatedTaxes);
  };
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
    setSelectedTaxIds(selectedOptions);
    const selected = allTaxes.filter((tax: any) => selectedOptions.includes(tax._id));
    setSelectedTax((prevSelected: any) => {
      const existingTaxIds = new Set(prevSelected ? prevSelected.map((tax: any) => tax._id) : []);
      const newSelected = selected.filter((tax: any) => !existingTaxIds.has(tax._id));
      return [...(prevSelected || []), ...newSelected];
    });
  };

  const handleQuestionEdit = async (id: string) => {
    setQuestionId(() => id)
    setOpenQuestionModal(() => true)
    try {
      const response = await apiClient.get(`product/fq/by/${id}`);
      setForcedQuestionFormData(response?.data?.forceQuestion)
      setSelectedFQAnswer((prev: any[]) => [
        ...prev,
        ...response?.data?.forceQuestion?.answers || []
      ]);
    } catch (error) {
      console.log("handleQuestionEdit", error);
      // console.log("selectedIds", selectedIds);
    }
  }

  const handleCloseQuestionModal = () => {
    setOpenQuestionModal(false)
    setSelectedFQAnswer([])
    setQuestionId("")
    setForcedQuestionFormData({
      question: '',
      question_level: 1,
      noOfChoice: 0,
      isActive: true,
      enforceAnswer: false,
      answers: []
    });
    setValidFQ({});
  }


  const productPhoto = useMemo(() => {
    if (selectedFile) {
      return URL.createObjectURL(selectedFile);
    }
    if (formData?.image) {
      return `${apiUrl}/${formData.image}`;
    }
    return NoImage;
  }, [selectedFile, formData?.image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validationError = validateImage(file);
      if (validationError) {
        setErrors(prev => ({ ...prev, image: validationError }));
        return;
      }
      setIsFileEdit(true);
      setSelectedFile(file);
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: "" }));
      }
    }
  };

  const handlePreviousFile = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
  };

  const resetFileInput = () => {
    if (imageRef.current) {
      imageRef.current.value = '';
    }
  };

  const handleDeletePhoto = () => {
    setIsFileEdit(false);
    setSelectedFile(null);
    setFormData((prev: any) => ({ ...prev, image: null }));
    resetFileInput();
  };

  const handleIngredientSubmit = async (ingredient: any): Promise<void> => {
    const minimalIngredient = {
      _id: ingredient._id,
      quantity: Number(ingredient.quantity),
      name: ingredient?.name,
      unit: ingredient?.unit
    };

    if (currentIngredientIndex !== null) {
      setIngredients((prev: any) => {
        const newIngredients = [...prev];
        newIngredients[currentIngredientIndex] = minimalIngredient;
        return newIngredients;
      });
    } else {
      setIngredients((prev: any) => [...prev, minimalIngredient]);
    }

    setIngredientModalOpen(false);
    setCurrentIngredientIndex(null);
  };


  const onIngredientFormClose = () => {
    setIngredientModalOpen(false);
    setCurrentIngredientIndex(null);
  };

  const handleEditIngredient = (index: any) => {
    setCurrentIngredientIndex(index);
    setIngredientModalOpen(true);
  };

  const handleDeleteIngredient = (index: any) => {
    setIngredients((prev: any) => prev.filter((_: any, i: any) => i !== index));
  }

  const restaurantData = restaurant?.[0];
  const currencySymbol =
    restaurantData?.company?.currency?.symbol || "";

  return (
    <>
      <FormHeaderPaths page={id ? 'Edit Product' : 'Add Product'} prevLink='/product/1/' prevPage='Products' />
      <div className="px-4 sm:px-6 lg:px-8">


        <div className="relative my-6 p-4  md:p-6 lg:p-8 bg-white dark:bg-DARK-800 shadow-md rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-gray-800 dark:text-DARK-100">{id ? 'Edit Product' : 'Add Product'}</h2>
          {isLoading && <FormLoader count={2} />}
          {!isLoading && <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs
              aria-label="Product form tabs"
              variant="underline"
              theme={{
                tablist: {
                  base: "flex flex-wrap gap-1 border-b border-DARK-200 dark:border-DARK-600 pb-0",
                  variant: {
                    underline: "flex-wrap",
                  },
                  tabitem: {
                    base: "flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg cursor-pointer transition-all duration-200 focus:outline-none focus:ring-0",
                    variant: {
                      underline: {
                        base: "rounded-t-lg border-b-2",
                        active: {
                          on: "text-BRAND-600 border-BRAND-500 dark:text-BRAND-400 dark:border-BRAND-400 bg-BRAND-50 dark:bg-DARK-700",
                          off: "border-transparent text-DARK-500 dark:text-DARK-400 hover:text-BRAND-500 hover:border-BRAND-300 dark:hover:text-BRAND-300",
                        },
                      },
                    },
                    icon: "h-4 w-4",
                  },
                },
                tabpanel: "pt-4",
              }}
            >
              <Tabs.Item active title="General Info" icon={HiInformationCircle}>
                <div className="relative bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                  {/* Status Toggle - Positioned in Corner */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className="flex items-center gap-3 bg-white dark:bg-DARK-700 p-2 px-3 rounded-xl border border-BRAND-200 dark:border-DARK-600 shadow-sm transition-all hover:border-BRAND-400">
                      <Label htmlFor="isAvailable" value="Available" className="text-xs font-semibold text-DARK-500 dark:text-DARK-300" />
                      <ToggleSwitch
                        id="isAvailable"
                        checked={formData.isAvailable === true}
                        onChange={(checked: boolean) => setFormData((prev: any) => ({ ...prev, isAvailable: checked }))}
                        className="focus:outline-none focus:ring-0 scale-90"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Right Side: Image Section */}
                    <div className="lg:col-span-1 flex items-center justify-center ">
                      <div className="flex flex-col items-center">
                        <label htmlFor="image" className="cursor-pointer">
                          <img
                            src={productPhoto}
                            alt="Product Preview"
                            className="w-32 h-32 md:w-48 md:h-48 object-cover rounded-full border-2 bg-DARK-100 dark:bg-DARK-200 border-DARK-300 shadow-lg"
                            onError={(e) => (e.currentTarget.src = NoImage)}
                          />
                        </label>
                        <input
                          type="file"
                          id="image"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          ref={imageRef}
                        />
                        <div className="flex gap-2">
                          {/* Always show pencil to upload/replace */}
                          <label htmlFor="image" className="cursor-pointer">
                            <div className="-mt-3.5 p-2 bg-white text-BRAND-600 border rounded-full cursor-pointer shadow-md hover:bg-gray-50 transition-colors">
                              <HiPencil />
                            </div>
                          </label>
                          {/* Show cross to revert if new file selected */}
                          {selectedFile && (
                            <div title="Cancel new selection" onClick={handlePreviousFile} className="-mt-3.5 p-2 cursor-pointer bg-white text-BRAND-600 border rounded-full shadow-md hover:bg-gray-50 transition-colors">
                              <RxCross2 className="font-extrabold" />
                            </div>
                          )}
                          {/* Show delete only if existing image (removes everything) */}
                          {formData?.image && (
                            <button className="-mt-3.5 p-2 cursor-pointer bg-white text-BRAND-600 border rounded-full shadow-md hover:bg-gray-50 transition-colors"
                              type="button"
                              title="Delete picture"
                              onClick={handleDeletePhoto}
                            >
                              <RiDeleteBin6Line />
                            </button>
                          )}
                        </div>
                        {errors.image && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.image}</p>}
                        <p className="mt-4 text-xs text-DARK-500 dark:text-DARK-400 text-center italic">
                          Click the photo or the pencil icon to upload a product image.
                        </p>
                      </div>
                    </div>
                    {/* Left Side: All Inputs */}
                    <div className="lg:col-span-2 space-y-6 ">
                      {/* Business & Restaurant */}
                      <div className={`grid ${loginRole === SUPER_ADMIN ? "grid-cols-1 sm:grid-cols-2" : ""} gap-4`}>
                        {loginRole === SUPER_ADMIN &&
                          <div className="flex flex-col min-[1024px]:max-[1045px]:col-span-2  mb-2 [&_*]:!min-w-0" ref={companyRef}>
                            <CompanyField
                              companies={companies}
                              selectedCompanyId={formData?.company?._id || formData?.company}
                              handleChange={handleChange}
                              error={errors.company}
                            />
                          </div>
                        }
                        {OWNER_ROLES.includes(loginRole) && (<div className="flex flex-col min-[1024px]:max-[1045px]:col-span-2 mb-2 [&_*]:!min-w-0" ref={restaurantRef}>
                          <RestaurantField
                            restaurants={restaurant}
                            selectedRestaurantId={formData?.restaurant?._id || formData?.restaurant}
                            handleChange={handleChange}
                            error={errors.restaurant}
                          />
                        </div>)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="name" value="Name"></Label><span className="text-ERROR_HOVER">*</span>
                          <CommonInput
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name ?? ''}
                            onChange={handleChange}
                            placeholder="Enter product name"
                            ref={nameRef}
                          // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                          />
                          {errors.name && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.name}</p>}
                        </div>
                        <div>
                          <Label htmlFor="sku" value="SKU"></Label>
                          <CommonInput
                            type="text"
                            id="sku"
                            name="sku"
                            value={formData.sku ?? ''}
                            onChange={handleChange}
                            placeholder="Enter product SKU"
                          // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                          />
                          {errors.sku && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.sku}</p>}
                        </div>
                        <div className="min-[1024px]:max-[1140px]:col-span-2">
                          <Label value="Category"></Label><span className="text-ERROR_HOVER">*</span>
                          <DropdownWithSearch
                            setSelectedItem={() => { }}
                            selectedItem={categorys?.find((c: any) => c._id === (formData?.category?._id || formData?.category))?.name || ''}
                            items={categorys}
                            title="Category"
                            handleFilter={handleSetCategory}
                            fieldKey="category"
                          />
                          {errors.category && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.category}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="price" value="Price"></Label><span className="text-ERROR_HOVER">*</span>
                          <NumberInputPOS
                            id="price"
                            name="price"
                            value={formData.price ?? ""}
                            onChange={(value) =>
                              handleChange({
                                target: {
                                  name: "price",
                                  value,
                                },
                              } as React.ChangeEvent<HTMLInputElement>)
                            }
                            allowDecimal
                            maxDecimalPlaces={2}
                            placeholder="Enter product price"
                          // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                          />
                          {errors?.price && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.price}</p>}
                        </div>
                        <div>
                          <Label htmlFor="stock" value="Stock"></Label>
                          <NumberInputPOS
                            id="stock"
                            name="stock"
                            value={formData.stock ?? ""}
                            onChange={(value) =>
                              handleChange({
                                target: {
                                  name: "stock",
                                  value,
                                },
                              } as React.ChangeEvent<HTMLInputElement>)
                            }
                            allowDecimal={false}
                            placeholder="Enter available stock"
                          // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                          />
                          {errors?.stock && <p className="mt-1 text-sm text-ERROR_HOVER">{errors?.stock}</p>}
                        </div>
                        <div>
                          <Label htmlFor="unit" value="Unit" />
                          <CommonInput
                            type="text"
                            id="unit"
                            name="unit"
                            value={formData.unit ?? ''}
                            onChange={handleChange}
                            placeholder="Enter unit"
                          // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type" value="Type" />
                          <CommonInput
                            type="text"
                            id="type"
                            name="type"
                            value={formData.type ?? ''}
                            onChange={handleChange}
                            placeholder="Enter type"
                          // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="mt-6">
                    <Accordion collapseAll className="dark:border-DARK-600">
                      {[
                        <Accordion.Panel key="accordion-primary">
                          <Accordion.Title className="py-3 px-4 focus:ring-0 dark:text-DARK-200 dark:bg-DARK-700">Description (Primary)</Accordion.Title>
                          <Accordion.Content className="p-4 dark:bg-DARK-800 space-y-4">
                            <div>
                              <Label htmlFor="description" value="Description"></Label>
                              <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Enter product description"
                                className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                              // className="w-full px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                              />
                            </div>
                          </Accordion.Content>
                        </Accordion.Panel>,
                        ...languages.filter((lang: any) => lang?.code !== 'en').map((lang: any) => (
                          <Accordion.Panel key={`accordion-${lang?.code}`}>
                            <Accordion.Title className="py-3 px-4 focus:ring-0 dark:text-DARK-200 dark:bg-DARK-700">
                              {lang?.name} ({lang?.translatedName})
                            </Accordion.Title>
                            <Accordion.Content className="p-4 dark:bg-DARK-800 space-y-4">
                              <div>
                                <Label htmlFor={`name-${lang?.code}`} value={`Name ${lang?.name} (${lang?.translatedName})`}></Label>
                                <CommonInput
                                  type="text"
                                  id={`name-${lang?.code}`}
                                  value={formData?.nameMl?.[lang?.code] || ''}
                                  onChange={(e: any) => handleChangeWithLang('nameMl', lang?.code, e.target.value)}
                                  placeholder={`Product Name (${lang?.code.toUpperCase()})`}
                                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`descriptionMl-${lang?.code}`} value={`Description ${lang?.name} (${lang?.translatedName})`}></Label>
                                <textarea
                                  name="descriptionMl"
                                  id={`descriptionMl-${lang?.code}`}
                                  value={formData.descriptionMl?.[lang?.code] || ''}
                                  onChange={(e: any) => handleChangeWithLang('descriptionMl', lang?.code, e.target.value)}
                                  rows={3}
                                  placeholder={`Product Description (${lang?.code.toUpperCase()})`}
                                  className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                                // className="w-full px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                                />
                              </div>
                            </Accordion.Content>
                          </Accordion.Panel>
                        ))
                      ]}
                    </Accordion>
                  </div>
                </div>
              </Tabs.Item>

              <Tabs.Item title="Appearance" icon={HiColorSwatch}>
                <div className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="block items-center">
                      <Label htmlFor="fontType" value="Font Type" />
                      <div>
                        <Select onChange={handleChange} id="fontType" name="fontType" value={formData?.fontType}>
                          <option className="dark:text-DARK-100">Select font type</option>
                          <option className="dark:text-DARK-100" value={'arial'}>Arial</option>
                        </Select>
                      </div>
                    </div>

                    <div className="block items-center">
                      <Label htmlFor="fontSize" value="Font Size" />
                      <div>
                        <Select onChange={handleChange} id="fontSize" name="fontSize" value={formData?.fontSize}>
                          <option className="dark:text-DARK-100">Select font size</option>
                          <option className="dark:text-DARK-100" value={12}>12</option>
                          <option className="dark:text-DARK-100" value={14}>14</option>
                          <option className="dark:text-DARK-100" value={16}>16</option>
                          <option className="dark:text-DARK-100" value={18}>18</option>
                          <option className="dark:text-DARK-100" value={20}>20</option>
                          <option className="dark:text-DARK-100" value={22}>22</option>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between space-x-4">
                    <div className="flex flex-col items-center">
                      <Label htmlFor="background" value="Background" />
                      <div
                        className="relative w-10 h-10 rounded-full shadow-md"
                        style={{ backgroundColor: formData?.background || 'black' }}
                      >
                        <input
                          type="color"
                          name="background"
                          value={formData?.background || ''}
                          onChange={handleChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <Label htmlFor="fontColor" value="Font Color" />
                      <div
                        className="relative w-10 h-10 rounded-full shadow-md"
                        style={{ backgroundColor: formData?.fontColor || 'black' }}
                      >
                        <input
                          type="color"
                          name="fontColor"
                          value={formData?.fontColor || ''}
                          onChange={handleChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <Label htmlFor="itemColor" value="Item Color" />
                      <div
                        className="relative w-10 h-10 rounded-full shadow-md"
                        style={{ backgroundColor: formData?.itemColor || 'black' }}
                      >
                        <input
                          type="color"
                          name="itemColor"
                          value={formData?.itemColor || ''}
                          onChange={handleChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.Item>

              <Tabs.Item title="Advanced" icon={HiAdjustments}>
                <div className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                  <div>
                    <Label value="Forced Questions"></Label>
                    <div className="bg-light border p-3 rounded-md">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div key={index}>
                          <Label value={`Question ${index + 1}`}></Label>
                          <div className="flex items-center gap-3">
                            <select
                              name={`question-${index + 1}`}
                              id={`question-${index + 1}`}
                              value={selectedFQs[index] || ""}
                              onChange={(e) => handleQuestionChange(index, e.target.value)}
                              className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"

                            // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                            >
                              <option value="">Select Question</option>
                              {forcedQuestions && forcedQuestions?.length > 0 ?
                                forcedQuestions.map((item: any) => (
                                  <option key={item._id} value={item._id} >
                                    {item.question}
                                  </option>
                                )) :
                                <option value="">No questions available</option>
                              }
                            </select>
                            <Button
                              type="button"
                              onClick={(e: any) => {
                                e.preventDefault();
                                if (!selectedFQs[index]) { return };
                                handleQuestionEdit(selectedFQs[index])
                              }}
                              className={`${selectedFQs[index] ? '!bg-BRAND-500 hover:!bg-BRAND-600' : 'bg-DARK-400 dark:bg-DARK-300'} !ring-0`} size="sm" disabled={!selectedFQs[index]}>
                              <HiPencil className={`${selectedFQs[index] ? '' : 'text-DARK-400 dark:text-DARK-600'} text-white h-4 w-4`} />
                            </Button>

                          </div>
                        </div>
                      ))}
                      <div>
                        <Button
                          type="button"
                          onClick={() => setOpenQuestionModal(true)}
                          className="!bg-BRAND-500 hover:!bg-BRAND-600 mt-2 !ring-0">
                          Add question
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-4 mt-2">
                      <Checkbox
                        id="usedCatTax"
                        name="usedCatTax"
                        checked={(formData as any)?.usedCatTax || false}
                        onChange={handleChange}
                        className="checked:!bg-BRAND-500 !ring-0"
                      />
                      <Label htmlFor="usedCatTax" value="Use Category Tax?" className="cursor-pointer" />
                    </div>
                  </div>

                  {(formData as any)?.usedCatTax !== true && <div className="my-1">
                    <Label htmlFor="tax" value="Tax" />
                    <div className="h-11 w-full px-4 mb-2 py-2 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus-within:ring-2 focus-within:ring-BRAND-500/20 focus-within:border-BRAND-500 cursor-pointer flex items-center justify-between dark:bg-DARK-700 shadow-sm transition-all overflow-hidden">
                      {!selectedTax.length && <span className="text-DARK-500 dark:text-DARK-300">No Tax selected</span>}
                      <div className="flex flex-wrap gap-1 dark:bg-DARK-700">
                        {selectedTax.length > 0 && selectedTax.map((tax: any, index: number) => {
                          return (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                              {tax?.taxName}
                              <button
                                type="button"
                                onClick={(e: any) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleTaxToggle(tax);
                                }}
                                className="ml-1 text-blue-500 hover:text-blue-700"
                              >
                                <HiX size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <select
                      id="tax"
                      multiple
                      value={selectedTaxIds}
                      onChange={handleSelectChange}
                      className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                      // className="w-full px-4 py-2 dark:bg-DARK-700 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none cursor-pointer overflow-y-auto scrollbar-hide"
                      style={{ backgroundImage: "none" }}>
                      {allTaxes.length > 0 ?
                        allTaxes.map((item: any) => (
                          <option key={item?._id} value={item._id}>
                            {item.taxName} {item.rate} {item.type === "percentage" ? "%" : currencySymbol || configData?.currency?.symbol}
                          </option>
                        )) : <option disabled className="dark:text-DARK-400">No tax data found</option>}
                    </select>
                  </div>}
                </div>
              </Tabs.Item>

              <Tabs.Item title="Ingredients" icon={HiCollection}>
                <div className="bg-gray-50/50 dark:bg-DARK-800/50 p-5 md:p-6 rounded-xl border border-gray-100 dark:border-DARK-700 space-y-6">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="ingredients" value="Ingredients" />
                    <Button
                      type="button"
                      onClick={() => setIngredientModalOpen(true)}
                      className="!bg-BRAND-500 hover:!bg-BRAND-600 !ring-0"
                    >
                      Add ingredients
                    </Button>
                  </div>
                  <IngredientTable
                    ingredients={ingredients}
                    onEdit={handleEditIngredient}
                    onDelete={handleDeleteIngredient}
                  />
                </div>
              </Tabs.Item>

              <div className="flex flex-col items-center">
                <Label htmlFor="fontColor" value="Font Color" />
                <div
                  className="relative w-10 h-10 rounded-full shadow-md"
                  style={{ backgroundColor: formData?.fontColor || 'black' }}
                >
                  <input
                    type="color"
                    name="fontColor"
                    value={formData?.fontColor || ''}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <Label htmlFor="itemColor" value="Item Color" />
                <div
                  className="relative w-10 h-10 rounded-full shadow-md"
                  style={{ backgroundColor: formData?.itemColor || 'black' }}
                >
                  <input
                    type="color"
                    name="itemColor"
                    value={formData?.itemColor || ''}
                    onChange={handleChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                  />
                </div>
              </div>
            </Tabs>

            {/* Buttons - Right Aligned */}
            <div className="flex justify-between -gap-4 mt-6 pt-4 border-t border-DARK-300 dark:border-DARK-600">
              <div className="flex flex-col justify-end text-xs">
                {formData?._id && (
                  <>
                    <span className="text-DARK-400 dark:text-DARK-600">
                      Product updated on {formatDate(formData?.updatedAt, configData?.dateFormat)}, {formatTime(formData?.updatedAt)}
                    </span>
                    <span className="text-DARK-400 dark:text-DARK-600">
                      Product added on {formatDate(formData?.createdAt, configData?.dateFormat)}, {formatTime(formData?.createdAt)}
                    </span>
                  </>
                )}

              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => navigate(-1)}
                  disabled={!!isButtonLoading}
                  className="w-full max-w-[150px] px-2 py-1 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isButtonLoading}
                  className="!bg-BRAND-500 hover:!bg-BRAND-600 disabled:!bg-DARK-400 !ring-0"
                >
                  {isButtonLoading ? (
                    <>
                      <Spinner />
                      Saving...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </form >}
        </div >
      </div >

      <Modal size="7xl" show={openQuestionModal} onClose={() => { handleCloseQuestionModal() }} className="backdrop-blur-sm dark:bg-DARK-950">
        <Modal.Header className="dark:bg-DARK-800">{questionId ? "Edit" : "Add"} forced questions</Modal.Header>
        <Modal.Body className="dark:bg-DARK-800">
          <div className="space-y-6">
            <div className="max-w-full">
              <div className="flex flex-col mb-2">
                <Label htmlFor="Question" value="Question" />
                <CommonInput
                  type="text"
                  id="Question"
                  name="question"
                  value={forcedQuestionFormData?.question}
                  onChange={handleChangeFQ}
                  placeholder="Enter question"
                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                />
                {validFQ?.question && <p className="mt-1 text-sm text-ERROR_HOVER">Enter Question</p>}
              </div>
              <div className="flex flex-col mb-2">
                <div className="block">
                  <Label htmlFor="question_level" value="Question Level" />
                </div>
                <select
                  id="question_level"
                  name="question_level"
                  value={forcedQuestionFormData?.question_level}
                  onChange={handleChangeFQ}
                  className="w-full px-4 py-2.5 text-sm border-2 border-DARK-300 dark:border-none bg-slate-50 dark:placeholder:text-DARK-400 dark:text-DARK-200 rounded-xl focus:border-DARK-300 focus:ring-0 focus-visible:outline-none focus:shadow-none"
                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div className="flex flex-col mb-2">
                <div className="block">
                  <Label htmlFor="noOfChoice" value="No. of choice" />
                </div>
                <NumberInputPOS
                  id="noOfChoice"
                  name="noOfChoice"
                  allowDecimal={false}
                  value={forcedQuestionFormData?.noOfChoice}
                  onChange={(value) =>
                    handleChangeFQ({
                      target: {
                        name: "noOfChoice",
                        value,
                      },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                  placeholder="Enter No of choice"
                // className="w-full h-11 px-4 py-2 dark:bg-DARK-700 dark:placeholder:text-DARK-400 dark:text-DARK-200 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 shadow-sm transition-all outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox className="checked:!bg-BRAND-500 !ring-0" onChange={handleChangeFQ} id="isActive" checked={forcedQuestionFormData?.isActive ? true : false} name="isActive" />
                <Label className="cursor-pointer" htmlFor="isActive">isActive?</Label>

                <Checkbox className="checked:!bg-BRAND-500 !ring-0" onChange={handleChangeFQ} id="enforceAnswer" checked={forcedQuestionFormData?.enforceAnswer ? true : false} name="enforceAnswer" />
                <Label className="cursor-pointer" htmlFor="enforceAnswer" value="Enforce an answer?"></Label>
              </div>
            </div>

            <div className="border rounded p-2 min-h-72 max-w-full">
              <div>
                <Button onClick={() => {
                  setSelectedFQAnswer([...formData.modifiers]);
                  setSearchTerm("");
                  setVisible(modifiers?.length ? [modifiers[0]?.categoryName] : []);
                  setOpenAnswerModal(true);
                }} className="!bg-BRAND-500 hover:!bg-BRAND-600 mb-1 focus:!ring-0">Add answer</Button>
              </div>
              <hr />
              <Label htmlFor="enforceAnswer" value="Answer"></Label>
              <div className="">
                {selectedFQAnswer.length > 0 &&
                  selectedFQAnswer.map((item: any) => (
                    <div key={item?._id} className="p-1 bg-slate-100 dark:bg-DARK-600 dark:text-DARK-100 rounded w-full flex justify-between my-1">
                      <span>{item.name}</span>
                      <span onClick={() => removeModifier(item._id)} className="my-auto text-red-700 dark:text-red-600 cursor-pointer"><IoMdCloseCircle /></span>
                    </div>
                  ))}

              </div>
            </div>

          </div>
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          <Button className="w-28 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { handleCloseQuestionModal() }}>
            Cancel
          </Button>
          <Button onClick={() => saveForcedQuestion()} disabled={questionId ? addQuestion : addQuestion} className="!bg-BRAND-500 hover:!bg-BRAND-600 mb-1 focus:!ring-0 w-28">
            {(questionId ? addQuestion : addQuestion) ? <Spinner /> : null}
            Save
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal size="7xl" show={openAnswerModal} onClose={() => {
        setOpenAnswerModal(false);
        setSearchTerm("");
        setVisible(modifiers?.length ? [modifiers[0]?.categoryName] : []);
        setSelectedFQAnswer([...formData.modifiers]);
      }}>
        <Modal.Header className="dark:bg-DARK-800 flex justify-between items-center">
          <span>Choose Modifiers</span>
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <TextInput
                onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
                id="Search"
                value={searchTerm}
                name="Search"
                type="text"
                placeholder="Search Modifiers"
                className="w-56 pr-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-DARK-400 hover:text-DARK-600 dark:text-DARK-500 dark:hover:text-DARK-300 focus:outline-none"
                >
                  <HiX size={16} />
                </button>
              )}
            </div>
          </div>
        </Modal.Header>
        <Modal.Body className="p-4 dark:bg-DARK-800">
          <div className="space-y-6 -p-8">
            <div className="max-w-full">
              <div className="flex flex-col ">
                <div className="block">
                  <Label htmlFor="item" value="Modifiers" />
                </div>
                <div className="min-h-9 w-full mb-3 px-3 py-2 dark:bg-DARK-700 border border-BRAND-200 dark:border-DARK-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-BRAND-500/20 focus:border-BRAND-500 cursor-pointer flex items-center justify-between shadow-sm transition-all" >
                  {selectedFQAnswer?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 py-0.5">
                      {selectedFQAnswer.map((modifier: any) => {
                        return (
                          <span key={modifier._id || modifier.name} className="flex items-center bg-BRAND-50 text-BRAND-700 text-xs font-medium px-2 py-0.5 rounded">
                            {modifier.name}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeModifier(modifier._id);
                              }}
                              className="ml-1 inline-flex items-center text-BRAND-500 hover:text-BRAND-700 focus:outline-none"
                            >
                              <HiX size={12} />
                            </button>
                          </span>
                        )
                      })}
                    </div>
                  ) : (
                    <span className="text-DARK-500 text-sm">No Modifiers Selected</span>
                  )}
                </div>
                {modifiers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-DARK-400 dark:text-DARK-500">
                    <HiCollection className="w-12 h-12 mb-3 opacity-50" />
                    <p className="text-sm font-medium">No modifiers available</p>
                    <p className="text-xs mt-1">Please select a company and restaurant first.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[5px]">
                    {modifiers.map((category: any) => (
                      <div key={category?.categoryName} className="mb-4 flex flex-col">
                        <div
                          className="w-full h-11 p-2 border border-BRAND-200 dark:border-DARK-600 bg-white dark:bg-DARK-700 text-DARK-600 dark:text-DARK-100 rounded-xl font-semibold cursor-pointer flex justify-between items-center gap-3 transition-all hover:border-BRAND-400 shadow-sm"
                          onClick={() => handleToggleCategory(category?.categoryName)}
                        >
                          {category.categoryName}
                          <span>
                            {visible.includes(category?.categoryName) ? <FaChevronUp className="text-BRAND-500" /> : <FaChevronDown className="text-DARK-400" />}
                          </span>
                        </div>
                        {visible.includes(category?.categoryName) && (
                          <div className="p-3 mt-1 border border-BRAND-100 dark:border-DARK-600 rounded-xl shadow-lg bg-white dark:bg-DARK-700 overflow-hidden">
                            <div className="overflow-y-auto max-h-36 space-y-1">
                              {category?.modifier
                                .filter((modifier: any) => modifier?.name.toLowerCase().includes(searchTerm))
                                .map((modifier: any) => (
                                  <div key={modifier?._id} className="flex items-center">
                                    <Checkbox
                                      id={modifier?._id}
                                      checked={selectedFQAnswer.some((m: any) => m._id === modifier._id)}
                                      onChange={() => handleModifierToggle(modifier)}
                                      className="mr-2 checked:!bg-BRAND-500 !ring-0 "
                                    />
                                    <label htmlFor={modifier?._id} className="text-sm cursor-pointer dark:text-DARK-100">
                                      {modifier.name}
                                    </label>
                                  </div>
                                ))}
                              {category?.modifier.filter((modifier: any) => modifier?.name.toLowerCase().includes(searchTerm)).length === 0 && (
                                <p className="text-xs text-DARK-400 dark:text-DARK-500 py-2 text-center">No matching modifiers</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {errors.modifiers && <p className="mt-1 text-sm text-ERROR_HOVER">{errors.modifiers}</p>}
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-end dark:bg-DARK-800">
          <Button
            className="w-28 bg-SECONDARY dark:bg-DARK-700 text-white rounded-lg font-medium shadow-sm hover:!bg-SECONDARY_HOVER dark:hover:!bg-DARK-600 focus:!ring-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setOpenAnswerModal(false);
              setSearchTerm("");
              setVisible(modifiers?.length ? [modifiers[0]?.categoryName] : []);
              setSelectedFQAnswer([...formData.modifiers]);
            }}
          >
            Cancel
          </Button>
          <Button className="!bg-BRAND-500 hover:!bg-BRAND-600 mb-1 focus:!ring-0 w-28"
            onClick={() => {
              setOpenAnswerModal(false);
              setFormData((prev: any) => ({
                ...prev,
                modifiers: selectedFQAnswer,
              }));
            }}>

            Save
          </Button>
        </Modal.Footer>
      </Modal>
      <IngredientsForm
        open={ingredientModalOpen}
        setOpen={setIngredientModalOpen}
        ingredients={ingredients}
        setIngredients={setIngredients}
        company={formData?.company}
        restaurant={formData?.restaurant}
        onclose={onIngredientFormClose}
        onSubmit={handleIngredientSubmit}
        currentIngredientIndex={currentIngredientIndex}
      />
    </>

  );
};

export default ProductForm;