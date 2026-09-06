/* Bootstrap helper: load shared systems before page-specific code when manually included. */
window.AnimeFume=window.AnimeFume||{};
window.dispatchEvent(new CustomEvent('animefume:ready',{detail:{version:window.AnimeFume.version||'2.0.0'}}));
