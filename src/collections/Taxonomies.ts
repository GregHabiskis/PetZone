import type { CollectionConfig } from 'payload'
const shared=(slug:string):CollectionConfig=>({slug,admin:{useAsTitle:'name'},fields:[{name:'name',type:'text',localized:true,required:true},{name:'slug',type:'text',unique:true,index:true,required:true},{name:'description',type:'textarea',localized:true},{name:'image',type:'relationship',relationTo:'media'},{name:'seo',type:'group',fields:[{name:'title',type:'text',localized:true},{name:'description',type:'textarea',localized:true}]}]})
export const Brands=shared('brands');export const Categories=shared('categories')
