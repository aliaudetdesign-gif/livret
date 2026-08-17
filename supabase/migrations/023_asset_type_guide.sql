-- Ajoute le type "guide" à l'enum asset_type, pour la 5e section Essentiel
-- "Guide d'utilisation" : PDF de présentation / bonne utilisation de la
-- charte graphique, déposés par l'agence pour son client.
alter type asset_type add value 'guide';
