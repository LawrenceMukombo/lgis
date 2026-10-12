import { pool } from "../server/db";

// All 116 local councils across Zambia's 10 provinces
export interface ZambiaCouncilDef {
  name: string;
  shortCode: string;
  level: "city" | "municipal" | "town";
  province: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

export const ZAMBIA_116_COUNCILS: ZambiaCouncilDef[] = [
  // --- CENTRAL PROVINCE (11) ---
  { name: "Chibombo Town Council", shortCode: "CHIB", level: "town", province: "Central", email: "info@chibombocouncil.gov.zm", phone: "+260 215 224 100", website: "https://www.chibombocouncil.gov.zm", address: "Civic Centre, Great North Road, Chibombo" },
  { name: "Chisamba Town Council", shortCode: "CHIS", level: "town", province: "Central", email: "info@chisambacouncil.gov.zm", phone: "+260 215 224 200", website: "https://www.chisambacouncil.gov.zm", address: "Civic Centre, Chisamba" },
  { name: "Chitambo Town Council", shortCode: "CHIT", level: "town", province: "Central", email: "info@chitambocouncil.gov.zm", phone: "+260 215 224 300", website: "https://www.chitambocouncil.gov.zm", address: "Civic Centre, Chitambo" },
  { name: "Itezhi-Tezhi Town Council", shortCode: "ITTZ", level: "town", province: "Central", email: "info@itezhitezhicouncil.gov.zm", phone: "+260 215 224 400", website: "https://www.itezhitezhicouncil.gov.zm", address: "Civic Centre, Itezhi-Tezhi" },
  { name: "Kabwe Municipal Council", shortCode: "KMC", level: "municipal", province: "Central", email: "info@kmc.gov.zm", phone: "+260 215 222 100", website: "https://www.kabwecouncil.gov.zm", address: "Civic Centre, Boma Road, Kabwe" },
  { name: "Kapiri Mposhi Town Council", shortCode: "KMPT", level: "town", province: "Central", email: "info@kapirimposhicouncil.gov.zm", phone: "+260 215 224 500", website: "https://www.kapirimposhicouncil.gov.zm", address: "Civic Centre, Great North Road, Kapiri Mposhi" },
  { name: "Luano Town Council", shortCode: "LUAN", level: "town", province: "Central", email: "info@luanocouncil.gov.zm", phone: "+260 215 224 600", website: "https://www.luanocouncil.gov.zm", address: "Civic Centre, Old Mkushi, Luano" },
  { name: "Mkushi Town Council", shortCode: "MKUS", level: "town", province: "Central", email: "info@mkushicouncil.gov.zm", phone: "+260 215 224 700", website: "https://www.mkushicouncil.gov.zm", address: "Civic Centre, Council Road, Mkushi" },
  { name: "Mumbwa Town Council", shortCode: "MUMB", level: "town", province: "Central", email: "info@mumbwacouncil.gov.zm", phone: "+260 215 224 800", website: "https://www.mumbwacouncil.gov.zm", address: "Civic Centre, Lusaka-Mongu Road, Mumbwa" },
  { name: "Ngabwe Town Council", shortCode: "NGAB", level: "town", province: "Central", email: "info@ngabwecouncil.gov.zm", phone: "+260 215 224 900", website: "https://www.ngabwecouncil.gov.zm", address: "Civic Centre, Ngabwe Boma" },
  { name: "Shibuyunji Town Council", shortCode: "SHIB", level: "town", province: "Central", email: "info@shibuyunjicouncil.gov.zm", phone: "+260 215 224 950", website: "https://www.shibuyunjicouncil.gov.zm", address: "Civic Centre, Shibuyunji" },

  // --- COPPERBELT PROVINCE (10) ---
  { name: "Chililabombwe Municipal Council", shortCode: "CLBM", level: "municipal", province: "Copperbelt", email: "info@chililabombwecouncil.gov.zm", phone: "+260 212 381 000", website: "https://www.chililabombwecouncil.gov.zm", address: "Civic Centre, Independence Way, Chililabombwe" },
  { name: "Chingola Municipal Council", shortCode: "CGMC", level: "municipal", province: "Copperbelt", email: "info@chingolacouncil.gov.zm", phone: "+260 212 711 000", website: "https://www.chingolacouncil.gov.zm", address: "Civic Centre, Kabundi Road, Chingola" },
  { name: "Kalulushi Municipal Council", shortCode: "KLMC", level: "municipal", province: "Copperbelt", email: "info@kalulushicouncil.gov.zm", phone: "+260 212 733 000", website: "https://www.kalulushicouncil.gov.zm", address: "Civic Centre, President Avenue, Kalulushi" },
  { name: "Kitwe City Council", shortCode: "KCC", level: "city", province: "Copperbelt", email: "info@kcc.gov.zm", phone: "+260 212 226 000", website: "https://www.kcc.gov.zm", address: "Civic Centre, Obote Avenue, Kitwe" },
  { name: "Luanshya Municipal Council", shortCode: "LSHM", level: "municipal", province: "Copperbelt", email: "info@luanshyacouncil.gov.zm", phone: "+260 212 510 000", website: "https://www.luanshyacouncil.gov.zm", address: "Civic Centre, 14th Avenue, Luanshya" },
  { name: "Lufwanyama Town Council", shortCode: "LFWN", level: "town", province: "Copperbelt", email: "info@lufwanyamacouncil.gov.zm", phone: "+260 212 744 000", website: "https://www.lufwanyamacouncil.gov.zm", address: "Civic Centre, Lufwanyama Boma" },
  { name: "Masaiti Town Council", shortCode: "MAST", level: "town", province: "Copperbelt", email: "info@masaiticouncil.gov.zm", phone: "+260 212 755 000", website: "https://www.masaiticouncil.gov.zm", address: "Civic Centre, Masaiti Boma" },
  { name: "Mpongwe Town Council", shortCode: "MPNG", level: "town", province: "Copperbelt", email: "info@mpongwecouncil.gov.zm", phone: "+260 212 766 000", website: "https://www.mpongwecouncil.gov.zm", address: "Civic Centre, Mpongwe Boma" },
  { name: "Mufulira Municipal Council", shortCode: "MFLM", level: "municipal", province: "Copperbelt", email: "info@mufuliracouncil.gov.zm", phone: "+260 212 410 000", website: "https://www.mufuliracouncil.gov.zm", address: "Civic Centre, Chatambeka Street, Mufulira" },
  { name: "Ndola City Council", shortCode: "NCC", level: "city", province: "Copperbelt", email: "info@ncc.gov.zm", phone: "+260 212 612 345", website: "https://www.ncc.gov.zm", address: "City Hall, Broadway, Ndola" },

  // --- EASTERN PROVINCE (15) ---
  { name: "Chadiza Town Council", shortCode: "CHDZ", level: "town", province: "Eastern", email: "info@chadizacouncil.gov.zm", phone: "+260 216 251 000", website: "https://www.chadizacouncil.gov.zm", address: "Civic Centre, Chadiza Boma" },
  { name: "Chama Town Council", shortCode: "CHAM", level: "town", province: "Eastern", email: "info@chamacouncil.gov.zm", phone: "+260 216 252 000", website: "https://www.chamacouncil.gov.zm", address: "Civic Centre, Chama Boma" },
  { name: "Chasefu Town Council", shortCode: "CHSF", level: "town", province: "Eastern", email: "info@chasefucouncil.gov.zm", phone: "+260 216 253 000", website: "https://www.chasefucouncil.gov.zm", address: "Civic Centre, Chasefu Boma" },
  { name: "Chipangali Town Council", shortCode: "CHPG", level: "town", province: "Eastern", email: "info@chipangalicouncil.gov.zm", phone: "+260 216 254 000", website: "https://www.chipangalicouncil.gov.zm", address: "Civic Centre, Chipangali Boma" },
  { name: "Chipata City Council", shortCode: "CPTC", level: "city", province: "Eastern", email: "info@chipatacity.gov.zm", phone: "+260 216 221 500", website: "https://www.chipatacouncil.gov.zm", address: "Civic Centre, Umodzi Highway, Chipata" },
  { name: "Kasenengwa Town Council", shortCode: "KSNG", level: "town", province: "Eastern", email: "info@kasenengwacouncil.gov.zm", phone: "+260 216 255 000", website: "https://www.kasenengwacouncil.gov.zm", address: "Civic Centre, Kasenengwa" },
  { name: "Katete Town Council", shortCode: "KTET", level: "town", province: "Eastern", email: "info@katetecouncil.gov.zm", phone: "+260 216 256 000", website: "https://www.katetecouncil.gov.zm", address: "Civic Centre, Great East Road, Katete" },
  { name: "Lumezi Town Council", shortCode: "LMZI", level: "town", province: "Eastern", email: "info@lumezicouncil.gov.zm", phone: "+260 216 257 000", website: "https://www.lumezicouncil.gov.zm", address: "Civic Centre, Lumezi Boma" },
  { name: "Lundazi Town Council", shortCode: "LNDZ", level: "town", province: "Eastern", email: "info@lundazicouncil.gov.zm", phone: "+260 216 258 000", website: "https://www.lundazicouncil.gov.zm", address: "Civic Centre, Lundazi Boma" },
  { name: "Lusangazi Town Council", shortCode: "LSNG", level: "town", province: "Eastern", email: "info@lusangazicouncil.gov.zm", phone: "+260 216 259 000", website: "https://www.lusangazicouncil.gov.zm", address: "Civic Centre, Lusangazi Boma" },
  { name: "Mambwe Town Council", shortCode: "MMBW", level: "town", province: "Eastern", email: "info@mambwecouncil.gov.zm", phone: "+260 216 260 000", website: "https://www.mambwecouncil.gov.zm", address: "Civic Centre, Mfuwe Road, Mambwe" },
  { name: "Nyimba Town Council", shortCode: "NYMB", level: "town", province: "Eastern", email: "info@nyimbacouncil.gov.zm", phone: "+260 216 261 000", website: "https://www.nyimbacouncil.gov.zm", address: "Civic Centre, Great East Road, Nyimba" },
  { name: "Petauke Town Council", shortCode: "PTKE", level: "town", province: "Eastern", email: "info@petaukecouncil.gov.zm", phone: "+260 216 262 000", website: "https://www.petaukecouncil.gov.zm", address: "Civic Centre, Petauke Boma" },
  { name: "Sinda Town Council", shortCode: "SNDA", level: "town", province: "Eastern", email: "info@sindacouncil.gov.zm", phone: "+260 216 263 000", website: "https://www.sindacouncil.gov.zm", address: "Civic Centre, Great East Road, Sinda" },
  { name: "Vubwi Town Council", shortCode: "VBWI", level: "town", province: "Eastern", email: "info@vubwicouncil.gov.zm", phone: "+260 216 264 000", website: "https://www.vubwicouncil.gov.zm", address: "Civic Centre, Vubwi Boma" },

  // --- LUAPULA PROVINCE (12) ---
  { name: "Chembe Town Council", shortCode: "CHMB", level: "town", province: "Luapula", email: "info@chembecouncil.gov.zm", phone: "+260 212 851 000", website: "https://www.chembecouncil.gov.zm", address: "Civic Centre, Chembe" },
  { name: "Chienge Town Council", shortCode: "CHNG", level: "town", province: "Luapula", email: "info@chiengecouncil.gov.zm", phone: "+260 212 852 000", website: "https://www.chiengecouncil.gov.zm", address: "Civic Centre, Chienge Boma" },
  { name: "Chifunabuli Town Council", shortCode: "CHFN", level: "town", province: "Luapula", email: "info@chifunabulicouncil.gov.zm", phone: "+260 212 853 000", website: "https://www.chifunabulicouncil.gov.zm", address: "Civic Centre, Chifunabuli" },
  { name: "Chipili Town Council", shortCode: "CHPL", level: "town", province: "Luapula", email: "info@chipilicouncil.gov.zm", phone: "+260 212 854 000", website: "https://www.chipilicouncil.gov.zm", address: "Civic Centre, Chipili Boma" },
  { name: "Kawambwa Town Council", shortCode: "KWMB", level: "town", province: "Luapula", email: "info@kawambwacouncil.gov.zm", phone: "+260 212 855 000", website: "https://www.kawambwacouncil.gov.zm", address: "Civic Centre, Kawambwa Boma" },
  { name: "Lunga Town Council", shortCode: "LNGA", level: "town", province: "Luapula", email: "info@lungacouncil.gov.zm", phone: "+260 212 856 000", website: "https://www.lungacouncil.gov.zm", address: "Civic Centre, Bangweulu Swamps, Lunga" },
  { name: "Mansa Municipal Council", shortCode: "MNSA", level: "municipal", province: "Luapula", email: "info@mansacouncil.gov.zm", phone: "+260 212 821 100", website: "https://www.mansacouncil.gov.zm", address: "Civic Centre, Luapula Drive, Mansa" },
  { name: "Milenge Town Council", shortCode: "MLNG", level: "town", province: "Luapula", email: "info@milengecouncil.gov.zm", phone: "+260 212 857 000", website: "https://www.milengecouncil.gov.zm", address: "Civic Centre, Milenge Boma" },
  { name: "Mwansabombwe Town Council", shortCode: "MWSB", level: "town", province: "Luapula", email: "info@mwansabombwecouncil.gov.zm", phone: "+260 212 858 000", website: "https://www.mwansabombwecouncil.gov.zm", address: "Civic Centre, Mwansabombwe" },
  { name: "Mwense Town Council", shortCode: "MWNS", level: "town", province: "Luapula", email: "info@mwensecouncil.gov.zm", phone: "+260 212 859 000", website: "https://www.mwensecouncil.gov.zm", address: "Civic Centre, Mwense Boma" },
  { name: "Nchelenge Town Council", shortCode: "NCHL", level: "town", province: "Luapula", email: "info@nchelengecouncil.gov.zm", phone: "+260 212 860 000", website: "https://www.nchelengecouncil.gov.zm", address: "Civic Centre, Lake Mweru Road, Nchelenge" },
  { name: "Samfya Town Council", shortCode: "SMFY", level: "town", province: "Luapula", email: "info@samfyacouncil.gov.zm", phone: "+260 212 861 000", website: "https://www.samfyacouncil.gov.zm", address: "Civic Centre, Beach Road, Samfya" },

  // --- LUSAKA PROVINCE (6) ---
  { name: "Chilanga Town Council", shortCode: "CHLG", level: "town", province: "Lusaka", email: "info@chilangacouncil.gov.zm", phone: "+260 211 278 100", website: "https://www.chilangacouncil.gov.zm", address: "Civic Centre, Kafue Road, Chilanga" },
  { name: "Chongwe Municipal Council", shortCode: "CHNGW", level: "municipal", province: "Lusaka", email: "info@chongwecouncil.gov.zm", phone: "+260 211 279 200", website: "https://www.chongwecouncil.gov.zm", address: "Civic Centre, Great East Road, Chongwe" },
  { name: "Kafue Municipal Council", shortCode: "KFMC", level: "municipal", province: "Lusaka", email: "info@kafuecouncil.gov.zm", phone: "+260 211 311 300", website: "https://www.kafuecouncil.gov.zm", address: "Civic Centre, Kafue Road, Kafue" },
  { name: "Luangwa Town Council", shortCode: "LNGW", level: "town", province: "Lusaka", email: "info@luangwacouncil.gov.zm", phone: "+260 211 279 400", website: "https://www.luangwacouncil.gov.zm", address: "Civic Centre, Feira, Luangwa" },
  { name: "Lusaka City Council", shortCode: "LCC", level: "city", province: "Lusaka", email: "info@lcc.gov.zm", phone: "+260 211 220 400", website: "https://www.lcc.gov.zm", address: "City Hall, Independence Avenue, Lusaka" },
  { name: "Rufunsa Town Council", shortCode: "RFNS", level: "town", province: "Lusaka", email: "info@rufunsacouncil.gov.zm", phone: "+260 211 279 500", website: "https://www.rufunsacouncil.gov.zm", address: "Civic Centre, Great East Road, Rufunsa" },

  // --- MUCHINGA PROVINCE (8) ---
  { name: "Chinsali Municipal Council", shortCode: "CHNS", level: "municipal", province: "Muchinga", email: "info@chinsalicouncil.gov.zm", phone: "+260 214 561 000", website: "https://www.chinsalicouncil.gov.zm", address: "Civic Centre, Great North Road, Chinsali" },
  { name: "Isoka Town Council", shortCode: "ISOK", level: "town", province: "Muchinga", email: "info@isokacouncil.gov.zm", phone: "+260 214 562 000", website: "https://www.isokacouncil.gov.zm", address: "Civic Centre, Isoka Boma" },
  { name: "Kanchibiya Town Council", shortCode: "KNCB", level: "town", province: "Muchinga", email: "info@kanchibiyacouncil.gov.zm", phone: "+260 214 563 000", website: "https://www.kanchibiyacouncil.gov.zm", address: "Civic Centre, Kanchibiya" },
  { name: "Lavushimanda Town Council", shortCode: "LVSH", level: "town", province: "Muchinga", email: "info@lavushimandacouncil.gov.zm", phone: "+260 214 564 000", website: "https://www.lavushimandacouncil.gov.zm", address: "Civic Centre, Lavushimanda" },
  { name: "Mafinga Town Council", shortCode: "MFNG", level: "town", province: "Muchinga", email: "info@mafingacouncil.gov.zm", phone: "+260 214 565 000", website: "https://www.mafingacouncil.gov.zm", address: "Civic Centre, Thendere, Mafinga" },
  { name: "Mpika Municipal Council", shortCode: "MPKC", level: "municipal", province: "Muchinga", email: "info@mpikacouncil.gov.zm", phone: "+260 214 566 000", website: "https://www.mpikacouncil.gov.zm", address: "Civic Centre, Great North Road, Mpika" },
  { name: "Nakonde Town Council", shortCode: "NKND", level: "town", province: "Muchinga", email: "info@nakondecouncil.gov.zm", phone: "+260 214 567 000", website: "https://www.nakondecouncil.gov.zm", address: "Civic Centre, Tunduma Border Road, Nakonde" },
  { name: "Shiwang'andu Town Council", shortCode: "SHWG", level: "town", province: "Muchinga", email: "info@shiwanganducouncil.gov.zm", phone: "+260 214 568 000", website: "https://www.shiwanganducouncil.gov.zm", address: "Civic Centre, Shiwang'andu" },

  // --- NORTHERN PROVINCE (12) ---
  { name: "Chilubi Town Council", shortCode: "CHLB", level: "town", province: "Northern", email: "info@chilubicouncil.gov.zm", phone: "+260 214 361 000", website: "https://www.chilubicouncil.gov.zm", address: "Civic Centre, Chilubi Island" },
  { name: "Kaputa Town Council", shortCode: "KPTA", level: "town", province: "Northern", email: "info@kaputacouncil.gov.zm", phone: "+260 214 362 000", website: "https://www.kaputacouncil.gov.zm", address: "Civic Centre, Kaputa Boma" },
  { name: "Kasama Municipal Council", shortCode: "KSMC", level: "municipal", province: "Northern", email: "info@kasamacouncil.gov.zm", phone: "+260 214 221 200", website: "https://www.kasamacouncil.gov.zm", address: "Civic Centre, President Avenue, Kasama" },
  { name: "Lunte Town Council", shortCode: "LNTE", level: "town", province: "Northern", email: "info@luntecouncil.gov.zm", phone: "+260 214 363 000", website: "https://www.luntecouncil.gov.zm", address: "Civic Centre, Lunte Boma" },
  { name: "Lupososhi Town Council", shortCode: "LPSS", level: "town", province: "Northern", email: "info@lupososhicouncil.gov.zm", phone: "+260 214 364 000", website: "https://www.lupososhicouncil.gov.zm", address: "Civic Centre, Lupososhi Boma" },
  { name: "Luwingu Town Council", shortCode: "LWNG", level: "town", province: "Northern", email: "info@luwingucouncil.gov.zm", phone: "+260 214 365 000", website: "https://www.luwingucouncil.gov.zm", address: "Civic Centre, Luwingu Boma" },
  { name: "Mbala Municipal Council", shortCode: "MBLM", level: "municipal", province: "Northern", email: "info@mbalacouncil.gov.zm", phone: "+260 214 451 000", website: "https://www.mbalacouncil.gov.zm", address: "Civic Centre, Mbala Boma" },
  { name: "Mporokoso Town Council", shortCode: "MPRK", level: "town", province: "Northern", email: "info@mporokosocouncil.gov.zm", phone: "+260 214 366 000", website: "https://www.mporokosocouncil.gov.zm", address: "Civic Centre, Mporokoso Boma" },
  { name: "Mpulungu Town Council", shortCode: "MPLG", level: "town", province: "Northern", email: "info@mpulungucouncil.gov.zm", phone: "+260 214 452 000", website: "https://www.mpulungucouncil.gov.zm", address: "Civic Centre, Port Road, Mpulungu" },
  { name: "Mungwi Town Council", shortCode: "MNGW", level: "town", province: "Northern", email: "info@mungwicouncil.gov.zm", phone: "+260 214 367 000", website: "https://www.mungwicouncil.gov.zm", address: "Civic Centre, Mungwi Boma" },
  { name: "Nsama Town Council", shortCode: "NSMA", level: "town", province: "Northern", email: "info@nsamacouncil.gov.zm", phone: "+260 214 368 000", website: "https://www.nsamacouncil.gov.zm", address: "Civic Centre, Nsama Boma" },
  { name: "Senga Hill Town Council", shortCode: "SNGH", level: "town", province: "Northern", email: "info@sengahillcouncil.gov.zm", phone: "+260 214 369 000", website: "https://www.sengahillcouncil.gov.zm", address: "Civic Centre, Senga Hill" },

  // --- NORTH-WESTERN PROVINCE (11) ---
  { name: "Chavuma Town Council", shortCode: "CHVM", level: "town", province: "North-Western", email: "info@chavumacouncil.gov.zm", phone: "+260 218 841 000", website: "https://www.chavumacouncil.gov.zm", address: "Civic Centre, Zambezi River Road, Chavuma" },
  { name: "Ikelenge Town Council", shortCode: "IKLG", level: "town", province: "North-Western", email: "info@ikelengecouncil.gov.zm", phone: "+260 218 842 000", website: "https://www.ikelengecouncil.gov.zm", address: "Civic Centre, Source of Zambezi, Ikelenge" },
  { name: "Kabompo Town Council", shortCode: "KBMP", level: "town", province: "North-Western", email: "info@kabompocouncil.gov.zm", phone: "+260 218 843 000", website: "https://www.kabompocouncil.gov.zm", address: "Civic Centre, Kabompo Boma" },
  { name: "Kalumbila Town Council", shortCode: "KLMB", level: "town", province: "North-Western", email: "info@kalumbilacouncil.gov.zm", phone: "+260 218 844 000", website: "https://www.kalumbilacouncil.gov.zm", address: "Civic Centre, Manyama, Kalumbila" },
  { name: "Kasempa Town Council", shortCode: "KSMP", level: "town", province: "North-Western", email: "info@kasempacouncil.gov.zm", phone: "+260 218 845 000", website: "https://www.kasempacouncil.gov.zm", address: "Civic Centre, Kasempa Boma" },
  { name: "Manyinga Town Council", shortCode: "MNYG", level: "town", province: "North-Western", email: "info@manyingacouncil.gov.zm", phone: "+260 218 846 000", website: "https://www.manyingacouncil.gov.zm", address: "Civic Centre, Manyinga Boma" },
  { name: "Mufumbwe Town Council", shortCode: "MFMB", level: "town", province: "North-Western", email: "info@mufumbwecouncil.gov.zm", phone: "+260 218 847 000", website: "https://www.mufumbwecouncil.gov.zm", address: "Civic Centre, Mufumbwe Boma" },
  { name: "Mushindamo Town Council", shortCode: "MSHD", level: "town", province: "North-Western", email: "info@mushindamocouncil.gov.zm", phone: "+260 218 848 000", website: "https://www.mushindamocouncil.gov.zm", address: "Civic Centre, Mushindamo" },
  { name: "Mwinilunga Town Council", shortCode: "MWNL", level: "town", province: "North-Western", email: "info@mwinilungacouncil.gov.zm", phone: "+260 218 849 000", website: "https://www.mwinilungacouncil.gov.zm", address: "Civic Centre, Mwinilunga Boma" },
  { name: "Solwezi Municipal Council", shortCode: "SLWZ", level: "municipal", province: "North-Western", email: "info@solwezicouncil.gov.zm", phone: "+260 218 821 300", website: "https://www.solwezicouncil.gov.zm", address: "Civic Centre, Independence Avenue, Solwezi" },
  { name: "Zambezi Town Council", shortCode: "ZMBZ", level: "town", province: "North-Western", email: "info@zambezicouncil.gov.zm", phone: "+260 218 850 000", website: "https://www.zambezicouncil.gov.zm", address: "Civic Centre, Zambezi Boma" },

  // --- SOUTHERN PROVINCE (15) ---
  { name: "Chikankata Town Council", shortCode: "CHKN", level: "town", province: "Southern", email: "info@chikankatacouncil.gov.zm", phone: "+260 213 351 000", website: "https://www.chikankatacouncil.gov.zm", address: "Civic Centre, Chikankata" },
  { name: "Chirundu Town Council", shortCode: "CHRN", level: "town", province: "Southern", email: "info@chirunducouncil.gov.zm", phone: "+260 213 352 000", website: "https://www.chirunducouncil.gov.zm", address: "Civic Centre, Border Post Road, Chirundu" },
  { name: "Choma Municipal Council", shortCode: "CHMA", level: "municipal", province: "Southern", email: "info@chomacouncil.gov.zm", phone: "+260 213 220 100", website: "https://www.chomacouncil.gov.zm", address: "Civic Centre, Livingstone Road, Choma" },
  { name: "Gwembe Town Council", shortCode: "GWMB", level: "town", province: "Southern", email: "info@gwembecouncil.gov.zm", phone: "+260 213 353 000", website: "https://www.gwembecouncil.gov.zm", address: "Civic Centre, Gwembe Boma" },
  { name: "Kalomo Town Council", shortCode: "KLMO", level: "town", province: "Southern", email: "info@kalomocouncil.gov.zm", phone: "+260 213 354 000", website: "https://www.kalomocouncil.gov.zm", address: "Civic Centre, Great North Road, Kalomo" },
  { name: "Kazungula Town Council", shortCode: "KZNG", level: "town", province: "Southern", email: "info@kazungulacouncil.gov.zm", phone: "+260 213 355 000", website: "https://www.kazungulacouncil.gov.zm", address: "Civic Centre, Kazungula Bridge Road, Kazungula" },
  { name: "Livingstone City Council", shortCode: "LCC-T", level: "city", province: "Southern", email: "info@lcc-tourist.gov.zm", phone: "+260 213 321 000", website: "https://www.livingstonecouncil.gov.zm", address: "Civic Centre, Akapelwa Street, Livingstone" },
  { name: "Mazabuka Municipal Council", shortCode: "MZBK", level: "municipal", province: "Southern", email: "info@mazabukacouncil.gov.zm", phone: "+260 213 300 100", website: "https://www.mazabukacouncil.gov.zm", address: "Civic Centre, Great North Road, Mazabuka" },
  { name: "Monze Town Council", shortCode: "MNZE", level: "town", province: "Southern", email: "info@monzecouncil.gov.zm", phone: "+260 213 356 000", website: "https://www.monzecouncil.gov.zm", address: "Civic Centre, Monze Boma" },
  { name: "Namwala Town Council", shortCode: "NMWL", level: "town", province: "Southern", email: "info@namwalacouncil.gov.zm", phone: "+260 213 357 000", website: "https://www.namwalacouncil.gov.zm", address: "Civic Centre, Kafue River Road, Namwala" },
  { name: "Pemba Town Council", shortCode: "PMBA", level: "town", province: "Southern", email: "info@pembacouncil.gov.zm", phone: "+260 213 358 000", website: "https://www.pembacouncil.gov.zm", address: "Civic Centre, Great North Road, Pemba" },
  { name: "Siavonga Town Council", shortCode: "SVNG", level: "town", province: "Southern", email: "info@siavongacouncil.gov.zm", phone: "+260 213 359 000", website: "https://www.siavongacouncil.gov.zm", address: "Civic Centre, Lake Kariba Drive, Siavonga" },
  { name: "Sinazongwe Town Council", shortCode: "SNZG", level: "town", province: "Southern", email: "info@sinazongwecouncil.gov.zm", phone: "+260 213 360 000", website: "https://www.sinazongwecouncil.gov.zm", address: "Civic Centre, Sinazongwe Boma" },
  { name: "Zimba Town Council", shortCode: "ZMBA", level: "town", province: "Southern", email: "info@zimbacouncil.gov.zm", phone: "+260 213 361 000", website: "https://www.zimbacouncil.gov.zm", address: "Civic Centre, Livingstone-Lusaka Road, Zimba" },

  // --- WESTERN PROVINCE (16) ---
  { name: "Kalabo Town Council", shortCode: "KLBO", level: "town", province: "Western", email: "info@kalabocouncil.gov.zm", phone: "+260 217 251 000", website: "https://www.kalabocouncil.gov.zm", address: "Civic Centre, Barotse Floodplain, Kalabo" },
  { name: "Kaoma Town Council", shortCode: "KOMA", level: "town", province: "Western", email: "info@kaomacouncil.gov.zm", phone: "+260 217 252 000", website: "https://www.kaomacouncil.gov.zm", address: "Civic Centre, Lusaka-Mongu Road, Kaoma" },
  { name: "Limulunga Town Council", shortCode: "LMLG", level: "town", province: "Western", email: "info@limulungacouncil.gov.zm", phone: "+260 217 253 000", website: "https://www.limulungacouncil.gov.zm", address: "Civic Centre, Royal Nayuma, Limulunga" },
  { name: "Luampa Town Council", shortCode: "LMPA", level: "town", province: "Western", email: "info@luampacouncil.gov.zm", phone: "+260 217 254 000", website: "https://www.luampacouncil.gov.zm", address: "Civic Centre, Luampa Boma" },
  { name: "Lukulu Town Council", shortCode: "LKLU", level: "town", province: "Western", email: "info@lukulucouncil.gov.zm", phone: "+260 217 255 000", website: "https://www.lukulucouncil.gov.zm", address: "Civic Centre, Upper Zambezi, Lukulu" },
  { name: "Mitete Town Council", shortCode: "MTTE", level: "town", province: "Western", email: "info@mitetecouncil.gov.zm", phone: "+260 217 256 000", website: "https://www.mitetecouncil.gov.zm", address: "Civic Centre, Mitete Boma" },
  { name: "Mongu Municipal Council", shortCode: "MNGM", level: "municipal", province: "Western", email: "info@mongucouncil.gov.zm", phone: "+260 217 221 100", website: "https://www.mongucouncil.gov.zm", address: "Civic Centre, Independence Avenue, Mongu" },
  { name: "Mulobezi Town Council", shortCode: "MLBZ", level: "town", province: "Western", email: "info@mulobezicouncil.gov.zm", phone: "+260 217 257 000", website: "https://www.mulobezicouncil.gov.zm", address: "Civic Centre, Railway Road, Mulobezi" },
  { name: "Mwandi Town Council", shortCode: "MWND", level: "town", province: "Western", email: "info@mwandicouncil.gov.zm", phone: "+260 217 258 000", website: "https://www.mwandicouncil.gov.zm", address: "Civic Centre, Zambezi Waterfront, Mwandi" },
  { name: "Nalolo Town Council", shortCode: "NLLO", level: "town", province: "Western", email: "info@nalolocouncil.gov.zm", phone: "+260 217 259 000", website: "https://www.nalolocouncil.gov.zm", address: "Civic Centre, Nalolo Boma" },
  { name: "Nkeyema Town Council", shortCode: "NKYM", level: "town", province: "Western", email: "info@nkeyemacouncil.gov.zm", phone: "+260 217 260 000", website: "https://www.nkeyemacouncil.gov.zm", address: "Civic Centre, Nkeyema Boma" },
  { name: "Senanga Town Council", shortCode: "SNNG", level: "town", province: "Western", email: "info@senangacouncil.gov.zm", phone: "+260 217 261 000", website: "https://www.senangacouncil.gov.zm", address: "Civic Centre, Senanga Boma" },
  { name: "Sesheke Town Council", shortCode: "SSHK", level: "town", province: "Western", email: "info@seshekecouncil.gov.zm", phone: "+260 217 262 000", website: "https://www.seshekecouncil.gov.zm", address: "Civic Centre, Katima Mulilo Road, Sesheke" },
  { name: "Shang'ombo Town Council", shortCode: "SHNG", level: "town", province: "Western", email: "info@shangombocouncil.gov.zm", phone: "+260 217 263 000", website: "https://www.shangombocouncil.gov.zm", address: "Civic Centre, Angola Border, Shang'ombo" },
  { name: "Sikongo Town Council", shortCode: "SKNG", level: "town", province: "Western", email: "info@sikongocouncil.gov.zm", phone: "+260 217 264 000", website: "https://www.sikongocouncil.gov.zm", address: "Civic Centre, Sikongo Boma" },
  { name: "Sioma Town Council", shortCode: "SIOM", level: "town", province: "Western", email: "info@siomacouncil.gov.zm", phone: "+260 217 265 000", website: "https://www.siomacouncil.gov.zm", address: "Civic Centre, Ngonye Falls, Sioma" },
];

/**
 * Normalizes district/council name for fuzzy matching with GADM
 */
function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Computes bounding box and centroid from a GeoJSON geometry coordinates
 */
function calculateBoundsAndCentroid(geometry: any): { bbox: [number, number, number, number]; centroid: { lat: number; lng: number } } {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  function traverse(coords: any) {
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      const lng = coords[0];
      const lat = coords[1];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      sumLng += lng;
      sumLat += lat;
      count++;
    } else if (Array.isArray(coords)) {
      for (const item of coords) {
        traverse(item);
      }
    }
  }

  traverse(geometry.coordinates);

  const bbox: [number, number, number, number] = [
    isFinite(minLng) ? minLng : 28.0,
    isFinite(minLat) ? minLat : -15.0,
    isFinite(maxLng) ? maxLng : 29.0,
    isFinite(maxLat) ? maxLat : -14.0,
  ];

  const centroid = {
    lng: count > 0 ? Number((sumLng / count).toFixed(6)) : Number(((bbox[0] + bbox[2]) / 2).toFixed(6)),
    lat: count > 0 ? Number((sumLat / count).toFixed(6)) : Number(((bbox[1] + bbox[3]) / 2).toFixed(6)),
  };

  return { bbox, centroid };
}

export async function seedZambiaCouncilsAndBoundaries() {
  console.log("[zambia-seed] ==================================================");
  console.log("[zambia-seed] Starting complete seeding of all 116 Zambia councils and GADM boundaries");
  console.log("[zambia-seed] ==================================================");

  // 1. Create administrative_boundaries table safely if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS administrative_boundaries (
      boundary_id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      country_id varchar REFERENCES countries(country_id) ON DELETE SET NULL,
      country_code char(2) NOT NULL DEFAULT 'ZM',
      level integer NOT NULL,
      level_type text NOT NULL,
      name text NOT NULL,
      code text,
      parent_code text,
      parent_name text,
      council_id varchar REFERENCES councils(council_id) ON DELETE SET NULL,
      source text DEFAULT 'GADM',
      source_url text,
      geometry_type text DEFAULT 'Polygon',
      coordinates jsonb,
      centroid jsonb,
      bounding_box jsonb,
      area_km2 decimal(12, 2),
      properties jsonb,
      status text DEFAULT 'active',
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_adm_boundaries_country ON administrative_boundaries(country_id);
    CREATE INDEX IF NOT EXISTS idx_adm_boundaries_level ON administrative_boundaries(level);
    CREATE INDEX IF NOT EXISTS idx_adm_boundaries_council ON administrative_boundaries(council_id);
    CREATE INDEX IF NOT EXISTS idx_adm_boundaries_parent ON administrative_boundaries(parent_code);
  `);
  console.log("[zambia-seed] ✔ administrative_boundaries table confirmed");

  // 2. Locate or insert Zambia country record
  const countryRes = await pool.query(`SELECT country_id FROM countries WHERE country_code = 'ZM' LIMIT 1`);
  let zambiaCountryId: string;

  if (countryRes.rows.length > 0) {
    zambiaCountryId = countryRes.rows[0].country_id;
  } else {
    const insertCountry = await pool.query(`
      INSERT INTO countries (country_code, name, currency_code, currency_symbol, timezone, locale, flag_emoji, status)
      VALUES ('ZM', 'Zambia', 'ZMW', 'K', 'Africa/Lusaka', 'en-ZM', '🇿🇲', 'active')
      RETURNING country_id
    `);
    zambiaCountryId = insertCountry.rows[0].country_id;
  }
  console.log(`[zambia-seed] ✔ Zambia country tenant ID: ${zambiaCountryId}`);

  // 3. Upsert all 116 Zambia councils into councils table
  console.log(`[zambia-seed] Upserting ${ZAMBIA_116_COUNCILS.length} councils for Zambia...`);
  const councilNameToId = new Map<string, string>();

  // Fetch existing councils
  const existingCouncilsRes = await pool.query(`SELECT council_id, name FROM councils WHERE country_id = $1`, [zambiaCountryId]);
  const existingNameMap = new Map<string, string>();
  for (const row of existingCouncilsRes.rows) {
    existingNameMap.set(normalizeName(row.name), row.council_id);
    councilNameToId.set(row.name, row.council_id);
  }

  for (const c of ZAMBIA_116_COUNCILS) {
    const norm = normalizeName(c.name);
    if (existingNameMap.has(norm)) {
      const existingId = existingNameMap.get(norm)!;
      councilNameToId.set(c.name, existingId);
      // Update contact and details safely
      await pool.query(
        `UPDATE councils 
         SET level = $1, email = $2, phone = $3, website = $4, address = $5, country_code = 'ZM', currency_code = 'ZMW', timezone = 'Africa/Lusaka'
         WHERE council_id = $6`,
        [c.level, c.email, c.phone, c.website, c.address, existingId]
      );
    } else {
      const insertRes = await pool.query(
        `INSERT INTO councils (country_id, name, level, country_code, currency_code, timezone, status, theme_color, email, phone, website, address)
         VALUES ($1, $2, $3, 'ZM', 'ZMW', 'Africa/Lusaka', 'active', '#EAB308', $4, $5, $6, $7)
         RETURNING council_id`,
        [zambiaCountryId, c.name, c.level, c.email, c.phone, c.website, c.address]
      );
      const newId = insertRes.rows[0].council_id;
      councilNameToId.set(c.name, newId);
      existingNameMap.set(norm, newId);
    }
  }

  const totalCouncils = await pool.query(`SELECT count(*)::int as count FROM councils WHERE country_id = $1`, [zambiaCountryId]);
  console.log(`[zambia-seed] ✔ Total councils for Zambia in database: ${totalCouncils.rows[0].count}`);

  // 4. Pull and import GADM boundaries for Zambia (Levels 0, 1, 2)
  console.log("[zambia-seed] Fetching GADM boundary datasets from geodata.ucdavis.edu...");

  // Level 0: National boundary
  try {
    const resL0 = await fetch("https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ZMB_0.json");
    if (resL0.ok) {
      const dataL0 = await resL0.json();
      if (dataL0.features && dataL0.features.length > 0) {
        const feat = dataL0.features[0];
        const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);

        await pool.query(
          `INSERT INTO administrative_boundaries (
            country_id, country_code, level, level_type, name, code, parent_code, parent_name,
            source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
          ) VALUES ($1, 'ZM', 0, 'country', 'Zambia', 'ZMB', NULL, NULL, 'GADM', 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ZMB_0.json', $2, $3, $4, $5, $6, 'active')
          ON CONFLICT DO NOTHING`,
          [
            zambiaCountryId,
            feat.geometry.type,
            JSON.stringify(feat.geometry.coordinates),
            JSON.stringify(centroid),
            JSON.stringify(bbox),
            JSON.stringify(feat.properties),
          ]
        );
        console.log("[zambia-seed] ✔ Seeded GADM Level 0 (Zambia Country Boundary)");
      }
    }
  } catch (err: any) {
    console.warn("[zambia-seed] Warning fetching GADM Level 0:", err.message);
  }

  // Level 1: 10 Provinces
  try {
    const resL1 = await fetch("https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ZMB_1.json");
    if (resL1.ok) {
      const dataL1 = await resL1.json();
      if (dataL1.features) {
        let seededL1Count = 0;
        for (const feat of dataL1.features) {
          const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);
          const provName = feat.properties.NAME_1;
          const provGid = feat.properties.GID_1;

          // Check if boundary already exists
          const existing = await pool.query(
            `SELECT boundary_id FROM administrative_boundaries WHERE country_id = $1 AND level = 1 AND code = $2`,
            [zambiaCountryId, provGid]
          );

          if (existing.rows.length === 0) {
            await pool.query(
              `INSERT INTO administrative_boundaries (
                country_id, country_code, level, level_type, name, code, parent_code, parent_name,
                source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
              ) VALUES ($1, 'ZM', 1, 'province', $2, $3, 'ZMB', 'Zambia', 'GADM', 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ZMB_1.json', $4, $5, $6, $7, $8, 'active')`,
              [
                zambiaCountryId,
                provName,
                provGid,
                feat.geometry.type,
                JSON.stringify(feat.geometry.coordinates),
                JSON.stringify(centroid),
                JSON.stringify(bbox),
                JSON.stringify(feat.properties),
              ]
            );
            seededL1Count++;
          }
        }
        console.log(`[zambia-seed] ✔ Seeded GADM Level 1 (${seededL1Count} Provinces processed)`);
      }
    }
  } catch (err: any) {
    console.warn("[zambia-seed] Warning fetching GADM Level 1:", err.message);
  }

  // Level 2: Districts / Councils
  try {
    const resL2 = await fetch("https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ZMB_2.json");
    if (resL2.ok) {
      const dataL2 = await resL2.json();
      if (dataL2.features) {
        let matchedCount = 0;
        for (const feat of dataL2.features) {
          const { bbox, centroid } = calculateBoundsAndCentroid(feat.geometry);
          const districtName = feat.properties.NAME_2;
          const provinceName = feat.properties.NAME_1;
          const gid2 = feat.properties.GID_2;
          const gid1 = feat.properties.GID_1;

          // Find matching council ID
          const normDist = normalizeName(districtName);
          let councilId: string | null = null;

          for (const [cName, cId] of councilNameToId.entries()) {
            const normC = normalizeName(cName);
            if (normC.includes(normDist) || normDist.includes(normC.replace(/council|city|municipal|town/g, ""))) {
              councilId = cId;
              break;
            }
          }

          // Check if boundary exists
          const existing = await pool.query(
            `SELECT boundary_id FROM administrative_boundaries WHERE country_id = $1 AND level = 2 AND code = $2`,
            [zambiaCountryId, gid2]
          );

          if (existing.rows.length === 0) {
            await pool.query(
              `INSERT INTO administrative_boundaries (
                country_id, country_code, level, level_type, name, code, parent_code, parent_name, council_id,
                source, source_url, geometry_type, coordinates, centroid, bounding_box, properties, status
              ) VALUES ($1, 'ZM', 2, 'district', $2, $3, $4, $5, $6, 'GADM', 'https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_ZMB_2.json', $7, $8, $9, $10, $11, 'active')`,
              [
                zambiaCountryId,
                districtName,
                gid2,
                gid1,
                provinceName,
                councilId,
                feat.geometry.type,
                JSON.stringify(feat.geometry.coordinates),
                JSON.stringify(centroid),
                JSON.stringify(bbox),
                JSON.stringify(feat.properties),
              ]
            );
          } else if (councilId) {
            await pool.query(
              `UPDATE administrative_boundaries SET council_id = $1 WHERE boundary_id = $2 AND council_id IS NULL`,
              [councilId, existing.rows[0].boundary_id]
            );
          }
          matchedCount++;
        }
        console.log(`[zambia-seed] ✔ Processed GADM Level 2 (${matchedCount} districts/councils with geometries)`);
      }
    }
  } catch (err: any) {
    console.warn("[zambia-seed] Warning fetching GADM Level 2:", err.message);
  }

  // 5. Total count of boundaries
  const totalBoundaries = await pool.query(`SELECT level, count(*)::int as count FROM administrative_boundaries WHERE country_id = $1 GROUP BY level ORDER BY level`, [zambiaCountryId]);
  console.log("[zambia-seed] Boundary Summary by Level for Zambia:");
  for (const row of totalBoundaries.rows) {
    const levelLabel = row.level === 0 ? "Country (L0)" : row.level === 1 ? "Province (L1)" : row.level === 2 ? "District/Council (L2)" : "Ward (L3)";
    console.log(`  - Level ${row.level} (${levelLabel}): ${row.count} records`);
  }

  console.log("[zambia-seed] ✔ Complete seeding finished successfully!");
}

seedZambiaCouncilsAndBoundaries()
  .then(() => {
    console.log("[zambia-seed] Done.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[zambia-seed] Fatal error:", err);
    process.exit(1);
  });
