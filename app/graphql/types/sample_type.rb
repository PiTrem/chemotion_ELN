# frozen_string_literal: true

module Types
  class SampleType < Types::BaseObject
    field :name, String, description: 'Name of sample'
    field :target_amount_value, Float, description: 'Target amount value'
    field :target_amount_unit, String, description: 'Target amount unit'
    field :description, String, description: 'Description of sample'
    field :molfile, String, description: 'Molfile of sample'
    field :purity, Float, description: 'Purity of sample'
    field :deprecated_solvent, String, description: 'Deprecated solvent of sample'
    field :impurities, String, description: 'Impurities of sample'
    field :location, String, description: 'Location of sample'
    field :is_top_secret, Boolean, description: 'Sample is top secret?'
    field :external_label, String, description: 'External label of sample'
    field :short_label, String, description: 'Short label of sample'
    field :real_amount_value, Float, description: 'Real amount value'
    field :real_amount_unit, String, description: 'Real amount unit'
    field :imported_readout, String, description: 'Imported readout'
    field :sample_svg_file, String, description: 'Sample svg file'
    field :identifier, String, description: 'Identifier of sample'
    field :density, Float, description: 'Density of sample'
    field :melting_point, String, description: 'Melting point of sample'
    field :boiling_point, String, description: 'Boiling point of sample'
    field :xref, GraphQL::Types::JSON, description: 'Xref of sample'
    field :molarity_value, Float, description: 'Molarity value'
    field :molarity_unit, String, description: 'Molarity unit'
    field :molfile_version, String, description: 'Molfile version'
    field :stereo, GraphQL::Types::JSON, description: 'Stereo'
    field :metrics, String, description: 'Metrics'
    field :decoupled, Boolean, description: 'Sample is decoupled?'
    field :inventory_sample, Boolean, description: 'Sample belongs to chemical inventory'
    field :molecular_mass, Float, description: 'Molecular mass of sample'
    field :sum_formula, String, description: 'Sum formula'
    field :solvent, GraphQL::Types::JSON, description: 'Solvent'
    field :molecule, Types::MoleculeType, description: 'Molecule'
  end
end
