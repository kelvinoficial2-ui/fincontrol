// ============================================================
//  credores.js — Mapa de credores com logos via Cloudinary
//  Usado no ranking de ofensores e no formulário de lançamentos
// ============================================================

const CREDORES = {

  bancos: [
    {
      id:       'mercadopago',
      nome:     'Mercado Pago',
      categoria: 'Bancos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877855/MercadoPago_rtxpd8.png'
    },
    {
      id:       'itau',
      nome:     'Banco Itaú',
      categoria: 'Bancos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877854/Itau_pqrqcb.png'
    },
    {
      id:       'bancodobrasil',
      nome:     'Banco do Brasil',
      categoria: 'Bancos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877854/BancodoBrasil_mlzu4d.png'
    },
    {
      id:       'portoseguro',
      nome:     'Porto Seguro',
      categoria: 'Bancos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877854/PortoSeguro_hzrdyl.png'
    },
    {
      id:       'nubank',
      nome:     'Nubank',
      categoria: 'Bancos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877854/Nubank_mtlmar.png'
    }
  ],

  cartoes: [
    {
      id:       'carrefour',
      nome:     'Cartão Carrefour',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877940/CartaoCarrefour_zaylmm.png'
    },
    {
      id:       'bradescard',
      nome:     'Bradescard',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877939/CartaoBradesco_vpa9cx.png'
    },
    {
      id:       'willcard',
      nome:     'Willcard',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877938/CartaoWill_ubfjl7.png'
    },
    {
      id:       'ourocard',
      nome:     'Ourocard',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877938/Ourocard_z4ej2y.png'
    },
    {
      id:       'portocard',
      nome:     'Portocard',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877937/Cartao-Porto-1_btogs3.png'
    },
    {
      id:       'itaucard',
      nome:     'Itaucard',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877936/CartaoItauUniclassPlatinum_e6ys2i.png'
    },
    {
      id:       'nucard',
      nome:     'Nucard',
      categoria: 'Cartões',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877936/CartaoNubank_wlyjvk.png'
    }
  ],

  diversos: [
    {
      id:       'claro',
      nome:     'Claro',
      categoria: 'Diversos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773878001/clarologo_b1vm7p.png'
    },
    {
      id:       'vivo',
      nome:     'Vivo',
      categoria: 'Diversos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773878000/vivo_bkqdjc.png'
    },
    {
      id:       'suhai',
      nome:     'Suhai',
      categoria: 'Diversos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773878000/suhai_o8q492.png'
    },
    {
      id:       'riachuelo',
      nome:     'Riachuelo',
      categoria: 'Diversos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773877999/riachuelowhite_priz7q.png'
    },
    {
      id:       'outros',
      nome:     'Outros',
      categoria: 'Diversos',
      logo:     'https://res.cloudinary.com/doo0fzoef/image/upload/v1773878686/outros_md1ffq.png'
    }
  ]

};

// ── Lista flat (todos os credores em array único) ──────────
const CREDORES_LIST = [
  ...CREDORES.bancos,
  ...CREDORES.cartoes,
  ...CREDORES.diversos
];

// ── Busca credor por id ────────────────────────────────────
function getCredorById(id) {
  return CREDORES_LIST.find(c => c.id === id) || null;
}

// ── Busca credor por nome (busca parcial, case-insensitive) ─
function getCredorByNome(nome) {
  const n = nome.toLowerCase();
  return CREDORES_LIST.find(c => c.nome.toLowerCase().includes(n)) || null;
}
