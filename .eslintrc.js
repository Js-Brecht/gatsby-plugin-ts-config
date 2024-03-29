const { typescript } = require("eslint");

module.exports = typescript({
    "rules": {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-var-requires": "off",
        "no-prototype-builtins": "off",
        "@typescript-eslint/no-object-literal-type-assertion": "off",
        "@typescript-eslint/ban-types": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "valid-jsdoc": "off",
    },
});